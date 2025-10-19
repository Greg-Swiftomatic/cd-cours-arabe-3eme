const STORAGE_KEY = "arabic-course:user";

type AuthUser = {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
};

type AuthState = {
  user: AuthUser | null;
};

const state: AuthState = {
  user: null,
};

function setMessage(element: HTMLElement | null, text: string, variant: "info" | "error" | "success") {
  if (!element) return;
  element.textContent = text;
  element.classList.remove("hidden", "border-gray-200", "border-red-200", "border-emerald-200", "bg-gray-50", "bg-red-50", "bg-emerald-50", "text-gray-700", "text-red-700", "text-emerald-700");

  if (variant === "info") {
    element.classList.add("border", "border-gray-200", "bg-gray-50", "text-gray-700");
  } else if (variant === "error") {
    element.classList.add("border", "border-red-200", "bg-red-50", "text-red-700");
  } else {
    element.classList.add("border", "border-emerald-200", "bg-emerald-50", "text-emerald-700");
  }
}

function toggleModal(overlay: HTMLElement, visible: boolean) {
  overlay.classList.toggle("hidden", !visible);
  overlay.setAttribute("aria-hidden", visible ? "false" : "true");
  if (visible) {
    const emailInput = overlay.querySelector<HTMLInputElement>("input[name='email']");
    emailInput?.focus();
  }
}

function toggleForms(emailForm: HTMLFormElement | null, codeForm: HTMLFormElement | null, step: "email" | "code") {
  if (!emailForm || !codeForm) return;
  if (step === "email") {
    emailForm.classList.remove("hidden");
    codeForm.classList.add("hidden");
  } else {
    emailForm.classList.add("hidden");
    codeForm.classList.remove("hidden");
    const codeInput = codeForm.querySelector<HTMLInputElement>("input[name='code']");
    codeInput?.focus();
  }
}

function updateAuthTargets(user: AuthUser | null) {
  const identityTargets = document.querySelectorAll<HTMLElement>("[data-auth-identity]");
  const triggerButtons = document.querySelectorAll<HTMLButtonElement>("[data-auth-open]");

  identityTargets.forEach((el) => {
    if (user) {
      el.textContent = user.name?.trim() || user.email;
      el.classList.remove("hidden");
    } else {
      el.textContent = "";
      el.classList.add("hidden");
    }
  });

  triggerButtons.forEach((button) => {
    if (user) {
      button.textContent = "تبديل الحساب";
    } else {
      button.textContent = "تسجيل الدخول";
    }
  });
}

async function fetchProfile(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      id: data.id ?? 0,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  } catch (error) {
    console.warn("auth: failed to fetch profile", error);
    return null;
  }
}

function storeUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

async function handleProfileRefresh() {
  const profile = await fetchProfile();
  if (profile) {
    state.user = profile;
    storeUser(profile);
  } else {
    state.user = null;
    storeUser(null);
  }
  updateAuthTargets(state.user);
  document.dispatchEvent(new CustomEvent("auth:state", { detail: state }));
}

export function initAuthModal() {
  const overlay = document.querySelector<HTMLElement>("[data-auth-modal]");
  if (!overlay || overlay.dataset.ready === "true") return;
  overlay.dataset.ready = "true";

  const emailForm = overlay.querySelector<HTMLFormElement>("[data-auth-email-form]");
  const codeForm = overlay.querySelector<HTMLFormElement>("[data-auth-code-form]");
  const resendButton = overlay.querySelector<HTMLButtonElement>("[data-auth-resend]");
  const messageBox = overlay.querySelector<HTMLElement>("[data-auth-message]");

  let currentEmail = "";

  const openButtons = document.querySelectorAll<HTMLElement>("[data-auth-open]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleForms(emailForm ?? null, codeForm ?? null, "email");
      setMessage(messageBox, "", "info");
      if (messageBox) messageBox.classList.add("hidden");
      toggleModal(overlay, true);
    });
  });

  const closeElements = overlay.querySelectorAll<HTMLElement>("[data-auth-close]");
  closeElements.forEach((element) =>
    element.addEventListener("click", () => {
      toggleModal(overlay, false);
    }),
  );

  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleModal(overlay, false);
    }
  });

  emailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    if (!email) {
      setMessage(messageBox, "يرجى إدخال البريد الإلكتروني.", "error");
      return;
    }

    setMessage(messageBox, "جاري إرسال الرمز...", "info");
    emailForm.querySelectorAll("button, input").forEach((el) => (el.disabled = true));

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message ?? "تعذر إرسال الرمز.");
      }

      currentEmail = email;

      let successMessage = "تم إرسال الرمز. تحقق من بريدك الإلكتروني.";
      if (data.code) {
        successMessage += ` (للتجربة: ${data.code})`;
      }

      setMessage(messageBox, successMessage, "success");
      toggleForms(emailForm, codeForm, "code");
    } catch (error) {
      console.error("auth: login error", error);
      setMessage(messageBox, "تعذر إرسال الرمز. حاول مجددًا.", "error");
    } finally {
      emailForm.querySelectorAll("button, input").forEach((el) => (el.disabled = false));
    }
  });

  const submitCode = async (code: string) => {
    if (!currentEmail) {
      setMessage(messageBox, "الرجاء إدخال البريد الإلكتروني أولاً.", "error");
      toggleForms(emailForm ?? null, codeForm ?? null, "email");
      return;
    }

    setMessage(messageBox, "جاري التحقق من الرمز...", "info");
    codeForm?.querySelectorAll("button, input").forEach((el) => (el.disabled = true));

    try {
      const response = await fetch("/api/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, code }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message ?? "رمز غير صالح.");
      }

      setMessage(messageBox, "تم تسجيل الدخول بنجاح. سيتم تحديث الصفحة.", "success");
      toggleModal(overlay, false);
      state.user = data.user;
      storeUser(data.user ?? null);
      updateAuthTargets(state.user);
      document.dispatchEvent(new CustomEvent("auth:login", { detail: data.user }));

      // جلب الملف الشخصي وتحديث الصفحة لضمان مزامنة البيانات
      await handleProfileRefresh();
      window.setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("auth: verify error", error);
      setMessage(messageBox, "رمز غير صالح أو منتهي. حاول مرة أخرى.", "error");
    } finally {
      codeForm?.querySelectorAll("button, input").forEach((el) => (el.disabled = false));
    }
  };

  codeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(codeForm);
    const code = (formData.get("code") as string)?.trim();
    if (!code) {
      setMessage(messageBox, "يرجى إدخال الرمز المكون من أرقام.", "error");
      return;
    }
    await submitCode(code);
  });

  resendButton?.addEventListener("click", async () => {
    if (!currentEmail) {
      setMessage(messageBox, "أدخل البريد الإلكتروني لإعادة الإرسال.", "error");
      toggleForms(emailForm ?? null, codeForm ?? null, "email");
      return;
    }
    emailForm?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: false }));
  });

  // استعادة الحالة المخزنة
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state.user = JSON.parse(stored) as AuthUser;
    }
  } catch (error) {
    console.warn("auth: failed to parse stored user", error);
  }
  updateAuthTargets(state.user);

  // تأكيد الجلسة من الخادم
  handleProfileRefresh();
}
