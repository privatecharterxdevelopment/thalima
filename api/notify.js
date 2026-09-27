import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
//#region server/env.ts
var ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
function loadDotEnv() {
	try {
		const text = readFileSync(join(ROOT, ".env"), "utf8");
		for (const line of text.split("\n")) {
			if (!line || line.startsWith("#") || !line.includes("=")) continue;
			const i = line.indexOf("=");
			const key = line.slice(0, i).trim();
			const val = line.slice(i + 1).trim();
			if (key && process.env[key] == null) process.env[key] = val;
		}
	} catch {}
}
loadDotEnv();
//#endregion
//#region src/data/crew.ts
/** Live Thalima seats — synced with Supabase auth profiles. */
var crew = [
	{
		id: "captain",
		name: "Captain",
		title: "Captain",
		role: "captain",
		department: "bridge",
		departments: ["bridge"],
		level: 1,
		accounting: "captain",
		initials: "CA",
		watch: "Command",
		online: true,
		email: "captain@thalima.com",
		phone: "",
		photo: "",
		access: "crew",
		active: true
	},
	{
		id: "mate",
		name: "Mate",
		title: "First Mate",
		role: "first_officer",
		department: "deck",
		departments: ["deck", "bridge"],
		level: 2,
		accounting: "submitter",
		initials: "MA",
		watch: "Deck / OOW",
		online: true,
		email: "mate@thalima.com",
		phone: "",
		photo: "",
		access: "crew",
		active: true
	},
	{
		id: "stew",
		name: "Stew",
		title: "Stewardess",
		role: "stewardess",
		department: "interior",
		departments: ["interior"],
		level: 2,
		accounting: "accountant",
		initials: "ST",
		watch: "Interior",
		online: true,
		email: "stew@thalima.com",
		phone: "",
		photo: "",
		access: "crew",
		active: true
	},
	{
		id: "engineer",
		name: "Engineer",
		title: "Engineer",
		role: "engineer",
		department: "engineering",
		departments: ["engineering"],
		level: 2,
		accounting: "submitter",
		initials: "EN",
		watch: "Engineering",
		online: true,
		email: "engineer@thalima.com",
		phone: "",
		photo: "",
		access: "crew",
		active: true
	},
	{
		id: "chef",
		name: "Chef",
		title: "Chef",
		role: "chef",
		department: "galley",
		departments: ["galley"],
		level: 2,
		accounting: "submitter",
		initials: "CH",
		watch: "Galley",
		online: true,
		email: "chef@thalima.com",
		phone: "",
		photo: "",
		access: "crew",
		active: true
	},
	{
		id: "info",
		name: "Info",
		title: "Office",
		role: "captain",
		department: "bridge",
		departments: ["bridge"],
		level: 1,
		accounting: "captain",
		initials: "IN",
		watch: "Office",
		online: true,
		email: "info@thalima.com",
		phone: "",
		photo: "",
		access: "owner",
		active: true
	}
];
crew.map((c) => ({ ...c }));
var deptLabel = {
	bridge: "Bridge",
	engineering: "Engineering",
	interior: "Interior",
	galley: "Galley",
	deck: "Deck"
};
//#endregion
//#region src/lib/format.ts
function clock(iso) {
	return new Date(iso).toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Europe/Rome"
	});
}
function dueLine(iso) {
	const d = new Date(iso);
	const now = /* @__PURE__ */ new Date();
	if (d.toLocaleDateString("en-GB", { timeZone: "Europe/Rome" }) === now.toLocaleDateString("en-GB", { timeZone: "Europe/Rome" })) return `Today ${clock(iso)}`;
	return `Due ${d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "Europe/Rome"
	})}`;
}
//#endregion
//#region server/supabaseAdmin.ts
function url() {
	return process.env.VITE_SUPABASE_URL || "";
}
function serviceKey() {
	return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}
function supabaseAdminReady() {
	return Boolean(url() && serviceKey());
}
function supabaseAdmin() {
	return createClient(url(), serviceKey(), { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
}
//#endregion
//#region server/mail.ts
function appUrl(origin) {
	const clean = (value) => value.replace(/\/$/, "");
	if (origin && /^https?:\/\/[^\s]+$/i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) return clean(origin);
	const env = (process.env.APP_URL || process.env.VITE_APP_URL || "").replace(/\/$/, "");
	if (env && !/localhost|127\.0\.0\.1/i.test(env)) return env;
	if (origin && /^https?:\/\/[^\s]+$/i.test(origin)) return clean(origin);
	return "https://thalima.vercel.app";
}
function mailFrom() {
	return process.env.MAIL_FROM || "Thalima <onboarding@resend.dev>";
}
function wrap(base, inner) {
	return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f5f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e9ee;border-radius:22px;">
        <tr><td style="padding:40px 40px 36px;font-family:Inter,Helvetica,Arial,sans-serif;color:#2c3140;text-align:left;">
          <img src="${esc(base)}/logo.png" alt="Thalima" width="128" style="display:block;width:128px;height:auto;margin:0 0 32px;border:0;">
          ${inner}
          <p style="margin:36px 0 0;padding-top:22px;border-top:1px solid #e7e9ee;font-size:12px;line-height:1.6;color:#8b909a;">Thalima crew ops. The button opens this item when you are signed in.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
function actions(primary, secondary) {
	const main = `<a href="${esc(primary.href)}" style="display:inline-block;background:#6d5cff;color:#ffffff;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.02em;padding:14px 22px;border-radius:999px;">${esc(primary.label)}</a>`;
	const alt = secondary ? `<a href="${esc(secondary.href)}" style="display:inline-block;background:#ffffff;color:#2c3140;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.02em;padding:13px 18px;border-radius:999px;border:1px solid #e7e9ee;">${esc(secondary.label)}</a>` : "";
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="padding:0 10px 8px 0;">${main}</td>${alt ? `<td style="padding:0 0 8px 0;">${alt}</td>` : ""}</tr></table>`;
}
function kicker(label) {
	return `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8b909a;">${esc(label)}</p>`;
}
function title(value) {
	return `<p style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.04em;color:#2c3140;">${esc(value)}</p>`;
}
function copy(value) {
	return `<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#5c6470;">${esc(value)}</p>`;
}
function meta(label, value) {
	return `<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8b909a;">${esc(label)}</p><p style="margin:0 0 16px;font-size:16px;line-height:1.45;color:#2c3140;">${esc(value)}</p>`;
}
function person(id) {
	const row = crew.find((c) => c.id === id);
	return {
		name: row?.name ?? id,
		email: row?.email ?? "",
		first: row?.name.split(" ")[0] ?? id
	};
}
function mailLookup(token) {
	const url = process.env.VITE_SUPABASE_URL || "";
	const anon = process.env.VITE_SUPABASE_ANON_KEY || "";
	if (!token || !url || !anon) return null;
	return createClient(url, anon, {
		global: { headers: { Authorization: `Bearer ${token}` } },
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
async function emailFor(id, db) {
	const read = async (client) => {
		const { data } = await client.from("profiles").select("email, name").eq("id", id).maybeSingle();
		if (data?.email) return {
			email: String(data.email),
			name: String(data.name || id)
		};
		return null;
	};
	if (db) {
		const hit = await read(db);
		if (hit) return hit;
	}
	if (supabaseAdminReady()) {
		const hit = await read(supabaseAdmin());
		if (hit) return hit;
	}
	const p = person(id);
	return {
		email: p.email,
		name: p.name
	};
}
async function taskJobs(payload, db) {
	const from = (await emailFor(payload.fromId, db)).name.split(" ")[0] || "Crew";
	const due = dueLine(payload.due);
	const station = deptLabel[payload.department];
	const base = appUrl(payload.origin);
	const href = `${base}/board/${encodeURIComponent(payload.taskId)}`;
	const notes = `${base}/notifications`;
	const text = [
		`${payload.title}`,
		"",
		payload.body,
		"",
		`Due: ${due}`,
		`Station: ${station}`,
		`From: ${from}`,
		"",
		`Open task: ${href}`,
		`Notifications: ${notes}`
	].join("\n");
	const html = wrap(base, `${kicker("Task")}
    ${title(payload.title)}
    ${payload.body ? copy(payload.body) : ""}
    ${meta("Due", due)}
    ${meta("Station", `${station} · assigned by ${from}`)}
    ${actions({
		href,
		label: "Open task"
	}, {
		href: notes,
		label: "Notifications"
	})}`);
	return Promise.all(payload.assigneeIds.map(async (id) => {
		const to = await emailFor(id, db);
		return {
			to: to.email,
			toName: to.name,
			subject: `Task · ${payload.title} · ${due}`,
			html,
			text: `Hi ${to.name.split(" ")[0]},\n\n${text}`
		};
	}));
}
async function expenseJobs(payload, db) {
	const from = (await emailFor(payload.fromId, db)).name.split(" ")[0] || "Crew";
	const base = appUrl(payload.origin);
	const href = `${base}/accounting/expenses/${encodeURIComponent(payload.expenseId)}`;
	const queue = `${base}/accounting/approvals`;
	const to = await emailFor(payload.approverId, db);
	const text = [
		`Approval needed · ${payload.ref}`,
		payload.vendor,
		payload.amount,
		payload.category,
		payload.description,
		`From: ${from}`,
		`Open: ${href}`
	].join("\n");
	const html = wrap(base, `${kicker("Approval")}
    ${title("Approval needed")}
    ${copy(`${from} submitted ${payload.ref} for your sign-off.`)}
    ${meta("Vendor", payload.vendor)}
    ${meta("Amount", payload.amount)}
    ${meta("Category", payload.category)}
    ${payload.description ? meta("Note", payload.description) : ""}
    ${actions({
		href,
		label: "Open expense"
	}, {
		href: queue,
		label: "Approvals"
	})}`);
	return [{
		to: to.email,
		toName: to.name,
		subject: `Approval · ${payload.ref} · ${payload.amount}`,
		html,
		text: `Hi ${to.name.split(" ")[0]},\n\n${text}`
	}];
}
async function chatJobs(payload, db) {
	const from = (await emailFor(payload.fromId, db)).name.split(" ")[0] || "Crew";
	const base = appUrl(payload.origin);
	const href = `${base}/messages/${encodeURIComponent(payload.channelId)}`;
	const notes = `${base}/notifications`;
	const room = payload.channelId === "all" ? "All crew" : "you";
	const preview = payload.text.trim();
	const subject = payload.channelId === "all" ? `Chat · ${from} in All crew` : `Chat · ${from}`;
	const html = wrap(base, `${kicker("Chat")}
    ${title(`${from} wrote`)}
    ${copy(preview)}
    ${meta("Conversation", room)}
    ${actions({
		href,
		label: "Open chat"
	}, {
		href: notes,
		label: "Notifications"
	})}`);
	const text = [
		`${from} wrote to ${room}:`,
		"",
		preview,
		"",
		`Open chat: ${href}`,
		`Notifications: ${notes}`
	].join("\n");
	return Promise.all(payload.toIds.filter((id) => id && id !== payload.fromId).map(async (id) => {
		const to = await emailFor(id, db);
		return {
			to: to.email,
			toName: to.name,
			subject,
			html,
			text: `Hi ${to.name.split(" ")[0]},\n\n${text}`
		};
	}));
}
function esc(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function sendJobs(jobs) {
	const key = process.env.RESEND_API_KEY || "";
	const bcc = (process.env.MAIL_BCC || "").trim();
	const sent = [];
	for (const job of jobs) {
		if (!job.to || !job.to.includes("@")) continue;
		if (!key) {
			console.warn(`[mail] skip ${job.to} · ${job.subject} (no RESEND_API_KEY)`);
			continue;
		}
		const body = {
			from: mailFrom(),
			to: [job.to],
			subject: job.subject,
			html: job.html,
			text: job.text
		};
		if (bcc && bcc !== job.to) body.bcc = [bcc];
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const err = await res.text();
			console.warn(`[mail] fail ${job.to}: ${err.slice(0, 200)}`);
			continue;
		}
		sent.push(job.to);
	}
	return sent;
}
//#endregion
//#region server/notifyHandler.ts
function readBody(req) {
	if (typeof req.body === "string") return Promise.resolve(req.body);
	if (req.body && typeof req.body === "object") return Promise.resolve(JSON.stringify(req.body));
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
		req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
		req.on("error", reject);
	});
}
function send(res, status, body) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.setHeader("Cache-Control", "no-store");
	res.end(JSON.stringify(body));
}
async function handler(req, res) {
	if (req.method === "OPTIONS") {
		res.statusCode = 204;
		res.end("");
		return;
	}
	if (req.method !== "POST") {
		send(res, 405, { error: "POST only." });
		return;
	}
	const header = String(req.headers.authorization ?? "");
	const token = header.startsWith("Bearer ") ? header.slice(7) : "";
	const lookup = mailLookup(token);
	if (!lookup) {
		send(res, 401, { error: "Sign in required." });
		return;
	}
	const { data, error } = await lookup.auth.getUser(token);
	if (error || !data.user) {
		send(res, 401, { error: "Sign in required." });
		return;
	}
	let body;
	try {
		const raw = await readBody(req);
		body = raw ? JSON.parse(raw) : null;
	} catch {
		send(res, 400, { error: "Invalid notification." });
		return;
	}
	if (!body || body.kind !== "task" && body.kind !== "expense" && body.kind !== "chat") {
		send(res, 400, { error: "Invalid notification." });
		return;
	}
	send(res, 200, {
		ok: true,
		sent: (await sendJobs(body.kind === "expense" ? await expenseJobs(body, lookup) : body.kind === "chat" ? await chatJobs(body, lookup) : await taskJobs(body, lookup))).length
	});
}
//#endregion
export { handler as default };
