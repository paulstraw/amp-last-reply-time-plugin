import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PluginAPI, PluginThread, QuickAction, ThreadMessage } from '@ampcode/plugin'

export const description =
	'Shows when the agent last replied as a button above the composer of each thread. Click it to copy that reply.'

// Quick action copy text is limited to 100,000 characters.
const MAX_COPY_LENGTH = 100_000

export default function (amp: PluginAPI) {
	// The Mac app shows no status items and reports no active thread, so each thread gets its
	// own quick action instead.
	const buttons = new Map<string, QuickAction>()
	const replyText = new Map<string, string>()

	// Thread messages carry no reliable timestamps, so reply times are recorded at agent.end
	// and saved to disk to survive plugin reloads and app restarts.
	const timesFile = join(amp.system.cacheDirectory, 'last-reply-times.json')
	const lastReply = new Map<string, number>(Object.entries(readTimes()))

	function readTimes(): Record<string, number> {
		try {
			return JSON.parse(readFileSync(timesFile, 'utf8'))
		} catch {
			return {}
		}
	}

	function show(thread: PluginThread) {
		const time = lastReply.get(thread.id)
		const text = replyText.get(thread.id)
		if (time === undefined || !text) return
		const definition = {
			text: `Last reply ${formatTime(new Date(time))}`,
			icon: 'copy',
			action: 'copy',
			args: { text: text.slice(0, MAX_COPY_LENGTH) },
		} as const
		const button = buttons.get(thread.id)
		if (button) button.update(definition)
		else buttons.set(thread.id, thread.createQuickAction(definition))
	}

	amp.on('session.start', async (_event, ctx) => {
		if (!lastReply.has(ctx.thread.id) || replyText.has(ctx.thread.id)) return
		try {
			const text = lastReplyText(await ctx.thread.messages({ roles: ['assistant'], limit: 20 }))
			if (text) replyText.set(ctx.thread.id, text)
		} catch (error) {
			amp.logger.log(`Could not read messages for ${ctx.thread.id}: ${error}`)
		}
		show(ctx.thread)
	})

	amp.on('agent.end', (event, ctx) => {
		const text = lastReplyText(event.messages)
		if (text) replyText.set(event.thread.id, text)
		lastReply.set(event.thread.id, Date.now())
		try {
			mkdirSync(amp.system.cacheDirectory, { recursive: true })
			writeFileSync(timesFile, JSON.stringify(Object.fromEntries(lastReply)))
		} catch (error) {
			amp.logger.log(`Could not save reply times: ${error}`)
		}
		show(ctx.thread)
	})
}

/** The text of the latest assistant message that has any, skipping tool-call-only messages. */
function lastReplyText(messages: ThreadMessage[]): string | undefined {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i]
		if (message.role !== 'assistant') continue
		const text = message.content
			.flatMap((block) => (block.type === 'text' ? [block.text] : []))
			.join('\n\n')
			.trim()
		if (text) return text
	}
	return undefined
}

function formatTime(time: Date): string {
	const clock = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
	if (time.toDateString() === new Date().toDateString()) return clock
	return `${time.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${clock}`
}
