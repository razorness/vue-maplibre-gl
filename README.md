# vue-maplibre-gl

[![npm](https://img.shields.io/npm/v/vue-maplibre-gl.svg?style=flat-square)](https://www.npmjs.com/package/vue-maplibre-gl)
[![npm](https://img.shields.io/npm/dm/vue-maplibre-gl?style=flat-square)](https://www.npmjs.com/package/vue-maplibre-gl)
[![size](https://img.shields.io/bundlephobia/minzip/vue-maplibre-gl?label=size&style=flat-square)](https://bundlephobia.com/package/vue-maplibre-gl)
[![vue3](https://img.shields.io/badge/vue-3.x-brightgreen.svg?style=flat-square)](https://vuejs.org/)
[![MaplibreGL-JS](https://img.shields.io/badge/Maplibre%20GL%20JS-5.x-brightgreen?style=flat-square)](https://maplibre.org/projects/maplibre-gl-js/)
[![TypeScript](https://img.shields.io/badge/-TypeScript-informational?style=flat-square)](https://www.typescriptlang.org/)

A small Vue 3 plugin for [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js). Only additional dependency is [mitt](https://github.com/developit/mitt).

## Features

- Supports MapLibre GL JS v5.x
- Typescript support
- Components for map, controls, sources, markers and layers
- ⚠ NEW: Simple Draw Control to draw: polygon, circle and circle (static to camera viewport)
- Support for custom controls
- Customizable style switch which reloads sources and layers automatically
- Frame rate control included
- Support for multiple instances and global access by `useMap(key: string | symbol)`
- Simple way to switch displayed map language
- Automatic restart on CONTEXT_LOST_WEBGL which can happen on mobile devices when tab was in background for longer time
- Small size

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Draw Plugin](#draw-plugin)
- [Demo](#demo)

# Installation

```shell
yarn add vue-maplibre-gl maplibre-gl mitt
```

## Default import

Global Install:

```typescript
import VueMaplibreGl from 'vue-maplibre-gl'

app.use(VueMaplibreGl)
```

Add CSS:

```scss
@use "~maplibre-gl/dist/maplibre-gl.css";
@use "~vue-maplibre-gl/dist/vue-maplibre-gl.css";
@use "~vue-maplibre-gl/dist/vue-maplibre-gl-draw.css"; /* optional: only needed for draw component */
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

# Draw Plugin

Draw Plugin adds few dependencies from [Turf.js](https://turfjs.org/). That's all.

### Features

- draw/edit polygon
- draw/edit circle like polygon or viewport drag/zoom
- visualize area below minimal area size (in m²)

## Usage

Add CSS:

```scss
@use "~vue-maplibre-gl/dist/vue-maplibre-gl-draw.css";
```

```vue
<template>
    <mgl-map>
        <mgl-draw-control v-model="myDrawModel"/>
    </mgl-map>
</template>
```

You can use the draw plugin without using the `MglDrawComponent`. See [src/components/controls/draw.control.ts](src/components/controls/draw.control.ts) to get an example.

## Modes

### Polygon

![Polygon Mode](https://github.com/user-attachments/assets/ace434de-1336-4faa-a546-93c97606c0ff)

### Circle

![Circle Mode](https://github.com/user-attachments/assets/949fbca0-2eb2-4eb4-a5d8-b6b9f043bf46)

### Circle Static 

This mode uses a circle which behaves static to camera viewport. Can be very handy for usage on smartphones.

![Circle Static Mode](https://github.com/user-attachments/assets/055cdf60-4f69-4249-b537-19e88bbb950c)


## Styling Polygon and Circle Mode

There is a default style used which can be found in [src/plugins/draw/styles.ts](src/plugins/draw/styles.ts). 
To customize the design when drawing polygon or circle, you can set your own by:

```vue
<template>
    <mgl-map>
        <mgl-draw-control :style="myCustomStyle"/>
    </mgl-map>
</template>
```

## Styling Circle Static Mode

The draw component automatically uses padding settings from `fitBoundsOptions` of map instance. If you want to set them manually, you can do this by:
```scss
.maplibregl-draw-circle-mode {
  top: 50px;
  right: 50px;
  bottom: 50px;
  left: 50px;
}
```

Custom colors for static circle mode can be set by:
```scss
.maplibregl-draw-circle-mode-circle {
  background: rgba(231, 75, 60, 0.2);
  border: 2px solid #e74b3c;
}
```
See [src/plugins/draw/draw.plugin.scss](src/plugins/draw/draw.plugin.scss) for more details to style your own static circle mode.

# Usage

See [dev/App.vue](dev/App.vue) for a real world example.

# Demo

```shell
git clone https://github.com/razorness/vue-maplibre-gl.git
cd vue-maplibre-gl
yarn
yarn dev
```

## License

[MIT](http://opensource.org/licenses/MIT)
