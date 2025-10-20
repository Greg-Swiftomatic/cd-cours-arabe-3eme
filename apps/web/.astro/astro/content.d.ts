declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		
	};

	type DataEntryMap = {
		"cycle1": {
"00-summary": {
	id: "00-summary";
  collection: "cycle1";
  data: any
};
"02-ism-fael-siyagh": {
	id: "02-ism-fael-siyagh";
  collection: "cycle1";
  data: any
};
"03-ism-mafoul": {
	id: "03-ism-mafoul";
  collection: "cycle1";
  data: any
};
"04-zaman-makan": {
	id: "04-zaman-makan";
  collection: "cycle1";
  data: any
};
"05-ism-alah": {
	id: "05-ism-alah";
  collection: "cycle1";
  data: any
};
"06-ielal": {
	id: "06-ielal";
  collection: "cycle1";
  data: any
};
"07-ibdal": {
	id: "07-ibdal";
  collection: "cycle1";
  data: any
};
"08-tasghir": {
	id: "08-tasghir";
  collection: "cycle1";
  data: any
};
"09-nisba": {
	id: "09-nisba";
  collection: "cycle1";
  data: any
};
"10-maajem": {
	id: "10-maajem";
  collection: "cycle1";
  data: any
};
};
"cycle2": {
"01-idafa": {
	id: "01-idafa";
  collection: "cycle2";
  data: any
};
"02-mamnoo-sarf": {
	id: "02-mamnoo-sarf";
  collection: "cycle2";
  data: any
};
"03-sifa-mushabaha": {
	id: "03-sifa-mushabaha";
  collection: "cycle2";
  data: any
};
"04-ism-tafdil": {
	id: "04-ism-tafdil";
  collection: "cycle2";
  data: any
};
"05-uslub-taajub": {
	id: "05-uslub-taajub";
  collection: "cycle2";
  data: any
};
"06-uslub-madh-dham": {
	id: "06-uslub-madh-dham";
  collection: "cycle2";
  data: any
};
"07-uslub-nida": {
	id: "07-uslub-nida";
  collection: "cycle2";
  data: any
};
"08-uslub-tahdir-ighra": {
	id: "08-uslub-tahdir-ighra";
  collection: "cycle2";
  data: any
};
"09-uslub-ikhtisas": {
	id: "09-uslub-ikhtisas";
  collection: "cycle2";
  data: any
};
"10-uslub-istifham": {
	id: "10-uslub-istifham";
  collection: "cycle2";
  data: any
};
"preview": {
	id: "preview";
  collection: "cycle2";
  data: any
};
};

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}
