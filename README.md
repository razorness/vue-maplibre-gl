# vue-maplibre-gl

[![npm](https://img.shields.io/npm/v/vue-maplibre-gl.svg?style=flat-square)](https://www.npmjs.com/package/vue-maplibre-gl)
[![TypeScript](https://img.shields.io/badge/-Typescript-informational?style=flat-square)](https://www.typescriptlang.org/)
[![vue2](https://img.shields.io/badge/vue-3.x-brightgreen.svg?style=flat-square)](https://vuejs.org/)

A vue plugin for [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js). Only additional dependency is [mitt](https://github.com/developit/mitt).
Customizable Style switch is included. Support for custom controls.

Size: [31 KB](https://bundlephobia.com/package/vue-maplibre-gl)

## Table of contents

- [Installation](#installation)
- [Usage](#usage)

# Installation

```shell
yarn add vue-maplibre-gl maplibre-gl
```

## Default import

Global Install:

```typescript
import VueMaplibreGl from 'vue-maplibre-gl'

app.use(VueMaplibreGl)
```

Add SCSS:
```scss
@import "~vue-maplibre-gl/src/css/maplibre";
```

Use specific components:

```typescript
import { MglMap } from 'vue-maplibre-gl'

app.component('MglMap', MglMap)
```

or in a parent components `.vue` file

```html

<script>
	import { MglMap } from 'vue-maplibre-gl'

	export default {
		components: {
			MglMap
		},
		// ...
	}
</script>
```

# Usage

See [/dev/serve.vue](https://github.com/razorness/vue-maplibre-gl/blob/master/dev/serve.vue) for a real world example.

# Demo

```shell
git clone https://github.com/razorness/vue-maplibre-gl.git
cd vue-maplibre-gl
yarn
yarn serve
```

## PRs welcome ♥

If you have ideas, improvements, suggestions etc. don't hesitate to open a pull request.

### Todos

- [ ] Generate separate css file to be included (currently, you have to use scss)
- [ ] Usage examples
- [ ] Demo
- [ ] API documentation
- [ ] Support `v-model:...` for some basic props
- [ ] Add layer events

## License

[MIT](http://opensource.org/licenses/MIT)
