/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_MAP_STYLE_KEY: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
