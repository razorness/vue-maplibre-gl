<!--
	eslint-disable vue/no-v-html

	The only input to `v-html` is `markup()` below, applied to doc comments from this repository's own
	source files. It escapes `&`, `<` and `>` first and then re-introduces exactly three inline markdown
	forms. No user or remote content ever reaches it.
-->
<template>
	<div v-if="!meta" class="api-missing">
		No metadata for <code>{{ name }}</code
		>. Is it exported from <code>components/index.ts</code>? Run <code>pnpm meta</code>.
	</div>

	<div v-else class="api-table">
		<h3 :id="anchor(name)" tabindex="-1">
			{{ name }}
			<a class="header-anchor" :href="`#${anchor(name)}`" aria-hidden="true" />
		</h3>

		<p class="api-source">
			<code>import { {{ name }} } from '{{ meta.entry }}'</code>
		</p>

		<template v-if="meta.props.length">
			<h4>Props</h4>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="prop of meta.props" :key="prop.name">
						<td>
							<code>{{ prop.name }}</code>
							<span v-if="prop.required" class="api-badge api-badge--required">required</span>
							<span v-if="prop.deprecated" class="api-badge api-badge--deprecated">deprecated</span>
						</td>
						<td>
							<code class="api-type">{{ prop.type }}</code>
						</td>
						<td>
							<code v-if="prop.default">{{ prop.default }}</code>
							<span v-else class="api-empty">—</span>
						</td>
						<td v-html="markup(prop.description)" />
					</tr>
				</tbody>
			</table>
		</template>

		<template v-if="meta.events.length">
			<h4>Events</h4>
			<p v-if="meta.events[0]?.forwarded" class="api-note">
				Declared on <code>MglLayer</code> and forwarded through <code>$attrs</code>, so they work on this component without being
				re-declared.
			</p>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Payload</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="event of meta.events" :key="event.name">
						<td>
							<code>{{ event.name }}</code>
						</td>
						<td>
							<code class="api-type">{{ event.type }}</code>
						</td>
						<td v-html="markup(event.description)" />
					</tr>
				</tbody>
			</table>
		</template>

		<template v-if="meta.slots.length">
			<h4>Slots</h4>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="slot of meta.slots" :key="slot.name">
						<td>
							<code>{{ slot.name }}</code>
						</td>
						<td v-html="markup(slot.description)" />
					</tr>
				</tbody>
			</table>
		</template>

		<template v-if="meta.exposed.length">
			<h4>Exposed</h4>
			<p class="api-note">Reachable through a template ref.</p>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item of meta.exposed" :key="item.name">
						<td>
							<code>{{ item.name }}</code>
						</td>
						<td>
							<code class="api-type">{{ item.type }}</code>
						</td>
						<td v-html="markup(item.description)" />
					</tr>
				</tbody>
			</table>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import generated from '../../generated/components.json';

/**
 * Renders the API tables for one component from `docs/.vitepress/generated/components.json`, which
 * `scripts/gen-meta.mjs` derives from the components' own types and JSDoc. Never hand-maintain a prop
 * table in markdown — write the doc comment on the prop instead and it lands here, in the emitted
 * d.ts and in `web-types.json` at once.
 */
const props = defineProps<{ name: string }>();

interface Entry {
	name: string;
	type: string;
	required?: boolean;
	default?: string;
	deprecated?: boolean;
	forwarded?: boolean;
	description?: string;
}

interface ComponentMeta {
	name: string;
	entry: string;
	props: Entry[];
	events: Entry[];
	slots: Entry[];
	exposed: Entry[];
}

const meta = computed(() => (generated as ComponentMeta[]).find(component => component.name === props.name));

const anchor = (name: string) => name.toLowerCase();

/** The doc comments are markdown, but only ever inline — `code`, **bold**, links. */
function markup(text?: string): string {
	if (!text) return '<span class="api-empty">—</span>';
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll(/`([^`]+)`/g, '<code>$1</code>')
		.replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replaceAll(/\{@link ([^}]+)}/g, '<code>$1</code>');
}
</script>
