"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { Instructor } from "@/lib/courseTypes";

/* ─── constants ─────────────────────────────────────────────────────────── */

const VOICES = [
  { id: "af_heart",   label: "af_heart",   desc: "Soft female · Maria default" },
  { id: "af_bella",   label: "af_bella",   desc: "Warm female" },
  { id: "af_nicole",  label: "af_nicole",  desc: "Clear female" },
  { id: "am_michael", label: "am_michael", desc: "Warm male · Marco default" },
  { id: "am_adam",    label: "am_adam",    desc: "Deep male" },
  { id: "bf_emma",    label: "bf_emma",    desc: "British female" },
  { id: "bm_george",  label: "bm_george",  desc: "British male" },
];

const AVATAR_STYLES = [
  { id: "bottts-neutral",    label: "Bot",        hint: "Friendly robot" },
  { id: "lorelei",           label: "Lorelei",    hint: "Illustrated portrait" },
  { id: "micah",             label: "Micah",      hint: "Flat-design face" },
  { id: "avataaars-neutral", label: "Avataaars",  hint: "Cartoon person" },
  { id: "personas",          label: "Personas",   hint: "Diverse character" },
  { id: "notionists-neutral",label: "Notionist",  hint: "Minimal sketch" },
  { id: "pixel-art-neutral", label: "Pixel",      hint: "8-bit style" },
  { id: "identicon",         label: "Identicon",  hint: "Geometric pattern" },
];

const SEED_PRESETS = [
  "maria","marco","alex","sam","jade","river","quinn",
  "sage","nova","leo","luna","kai","felix","aria",
];

function dicebearUrl(style: string, seed: string, bg = "1e1e1e") {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=50`;
}

/* ─── main page ─────────────────────────────────────────────────────────── */

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Instructor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch("/api/admin/instructors").then((r) => r.json());
    setInstructors(r.instructors ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteInstructor = async (id: string) => {
    if (!confirm("Delete this instructor? Courses assigned to them will need a new one.")) return;
    setDeleting(id);
    await fetch(`/api/admin/instructors/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  const openNew = () => { setEditing(null); setIsNew(true); };
  const openEdit = (ins: Instructor) => { setEditing(ins); setIsNew(false); };
  const closeDrawer = () => { setEditing(null); setIsNew(false); };

  /* quick-create Maria / Marco if none exist */
  const quickCreate = async (preset: { name: string; subject: string; voiceId: string; avatarStyle: string }) => {
    await fetch("/api/admin/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...preset,
        bio: "",
        avatarSeed: preset.name.toLowerCase(),
        photoUrl: "",
      }),
    });
    load();
  };

  return (
    <div className="flex flex-col flex-1">
      {/* top bar */}
      <header className="border-b border-absolute-black px-6 md:px-10 h-12 flex items-center justify-between">
        <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
          § 03 — Instructors
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="font-mono tracking-mono text-[12px] uppercase px-4 py-1.5 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors flex items-center gap-2"
        >
          <span>+</span> New instructor
        </motion.button>
      </header>

      <main className="flex-1 px-6 md:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-[40px] leading-[1.05] tracking-[-0.02em]">Instructors.</h1>
          <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
            Click any card to edit their avatar, voice, and profile.
          </p>
        </motion.div>

        {loading ? (
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 animate-pulse">Loading…</p>
        ) : instructors.length === 0 ? (
          <EmptyState onQuickCreate={quickCreate} />
        ) : (
          <>
            {/* ── Instructor cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
              {instructors.map((ins, i) => (
                <InstructorCard
                  key={ins.id}
                  instructor={ins}
                  index={i}
                  onEdit={() => openEdit(ins)}
                  onDelete={() => deleteInstructor(ins.id)}
                  deleting={deleting === ins.id}
                />
              ))}

              {/* Add another card */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: instructors.length * 0.07 }}
                onClick={openNew}
                className="border border-dashed border-absolute-black/40 rounded-[3px] min-h-[320px] flex flex-col items-center justify-center gap-3 hover:border-absolute-black hover:bg-light-concrete/20 transition-colors group"
              >
                <span className="text-[32px] text-off-black/30 group-hover:text-absolute-black transition-colors">+</span>
                <span className="font-mono tracking-mono text-[12px] uppercase text-off-black/50 group-hover:text-absolute-black transition-colors">
                  Add instructor
                </span>
              </motion.button>
            </div>

            {/* ── Avatar style guide ── */}
            <AvatarStyleGuide instructors={instructors} />
          </>
        )}
      </main>

      <AnimatePresence>
        {(isNew || editing) && (
          <InstructorDrawer
            instructor={editing ?? undefined}
            onClose={closeDrawer}
            onSaved={() => { closeDrawer(); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── instructor card ───────────────────────────────────────────────────── */

function InstructorCard({
  instructor: ins,
  index,
  onEdit,
  onDelete,
  deleting,
}: {
  instructor: Instructor;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const style = (ins as Instructor & { avatarStyle?: string }).avatarStyle ?? "bottts-neutral";
  const avatarSrc = ins.photoUrl || dicebearUrl(style, ins.avatarSeed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="border border-absolute-black rounded-[3px] overflow-hidden group"
    >
      {/* portrait */}
      <div
        className="relative h-56 bg-off-black overflow-hidden cursor-pointer"
        onClick={onEdit}
      >
        <motion.img
          src={avatarSrc}
          alt={ins.name}
          className={`absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105 ${
            ins.photoUrl ? "object-cover grayscale contrast-110" : "object-contain p-10"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-off-black/90 via-off-black/20 to-transparent" />

        {/* hover overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-absolute-black/50"
        >
          <span className="font-mono tracking-mono text-[12px] uppercase text-pure-white border border-pure-white/60 px-4 py-2 rounded-[3px]">
            Edit profile →
          </span>
        </motion.div>

        {/* name + voice */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
          <p className="text-[28px] leading-none text-pure-white">{ins.name}</p>
          <p className="mt-1.5 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/70 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
            {ins.voiceId}
          </p>
        </div>
      </div>

      {/* meta row */}
      <div className="px-4 py-3 flex items-center gap-3 border-t border-absolute-black">
        <div className="flex-1 min-w-0">
          <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 truncate">
            {ins.subject}
          </p>
          {ins.bio ? (
            <p className="mt-0.5 text-[13px] leading-[1.3] text-off-black/80 line-clamp-2">{ins.bio}</p>
          ) : (
            <p className="mt-0.5 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/30">No bio yet</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
            {ins.photoUrl ? "photo" : style}
          </span>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="font-mono tracking-mono-sm text-[10px] uppercase px-2.5 py-1 border border-absolute-black rounded-[2px] hover:bg-off-black hover:text-pure-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="font-mono tracking-mono-sm text-[10px] uppercase px-2.5 py-1 border border-absolute-black/20 rounded-[2px] text-off-black/40 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              {deleting ? "…" : "×"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── avatar style guide (bottom of page) ──────────────────────────────── */

function AvatarStyleGuide({ instructors }: { instructors: Instructor[] }) {
  const seed = instructors[0]?.avatarSeed ?? "maria";
  return (
    <div className="border border-absolute-black/20 p-6">
      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-4">
        Avatar style reference — previewed with seed "{seed}"
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {AVATAR_STYLES.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <img
              src={dicebearUrl(s.id, seed)}
              alt={s.label}
              className="w-12 h-12 rounded-full border border-absolute-black/20 bg-off-black"
            />
            <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 text-center leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── empty state ───────────────────────────────────────────────────────── */

function EmptyState({ onQuickCreate }: { onQuickCreate: (p: { name: string; subject: string; voiceId: string; avatarStyle: string }) => void }) {
  return (
    <div className="border border-absolute-black/30 p-10">
      <p className="text-[24px] leading-none">No instructors yet.</p>
      <p className="mt-2 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
        Create Maria and Marco to unlock course creation.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[480px]">
        {[
          { name: "Maria", subject: "Mathematics", voiceId: "af_heart", avatarStyle: "lorelei", desc: "Soft female voice · Math" },
          { name: "Marco", subject: "Science",     voiceId: "am_michael", avatarStyle: "lorelei", desc: "Warm male voice · Science" },
        ].map((p) => (
          <motion.button
            key={p.name}
            whileTap={{ scale: 0.97 }}
            onClick={() => onQuickCreate(p)}
            className="flex items-center gap-4 p-4 border border-absolute-black rounded-[3px] hover:bg-off-black hover:text-pure-white transition-colors group text-left"
          >
            <img
              src={dicebearUrl(p.avatarStyle, p.name.toLowerCase())}
              className="w-12 h-12 rounded-full bg-off-black"
              alt={p.name}
            />
            <div>
              <p className="text-[19px] leading-none">{p.name}</p>
              <p className="mt-1 font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 group-hover:text-pure-white/70">
                {p.desc}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─── drawer ────────────────────────────────────────────────────────────── */

function InstructorDrawer({
  instructor,
  onClose,
  onSaved,
}: {
  instructor?: Instructor;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(instructor);

  const [name,       setName]       = useState(instructor?.name       ?? "");
  const [subject,    setSubject]    = useState(instructor?.subject    ?? "Mathematics");
  const [voiceId,    setVoiceId]    = useState(instructor?.voiceId    ?? "af_heart");
  const [bio,        setBio]        = useState(instructor?.bio        ?? "");
  const [photoUrl,   setPhotoUrl]   = useState(instructor?.photoUrl   ?? "");
  const [avatarStyle, setAvatarStyle] = useState(
    (instructor as (Instructor & { avatarStyle?: string }) | undefined)?.avatarStyle ?? "lorelei"
  );
  const [avatarSeed, setAvatarSeed] = useState(instructor?.avatarSeed ?? "");
  const [tab,        setTab]        = useState<"bot" | "photo">(instructor?.photoUrl ? "photo" : "bot");
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  const effectiveSeed = avatarSeed.trim() || name.toLowerCase() || "instructor";
  const previewSrc = tab === "photo" && photoUrl
    ? photoUrl
    : dicebearUrl(avatarStyle, effectiveSeed);

  const save = async () => {
    if (!name.trim() || !subject || !voiceId) {
      setErr("Name, subject, and voice are required.");
      return;
    }
    setErr(null);
    setBusy(true);

    const body = {
      name: name.trim(),
      subject,
      voiceId,
      bio: bio.trim(),
      avatarStyle,
      avatarSeed: effectiveSeed,
      photoUrl: tab === "photo" ? photoUrl.trim() : "",
    };

    const url  = isEdit ? `/api/admin/instructors/${instructor!.id}` : "/api/admin/instructors";
    const method = isEdit ? "PATCH" : "POST";
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();

    if (json.error) { setErr(json.error); setBusy(false); return; }
    setBusy(false);
    onSaved();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-absolute-black/40"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[560px] bg-pure-white border-l border-absolute-black flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 h-12 border-b border-absolute-black shrink-0">
          <p className="font-mono tracking-mono text-[12px] uppercase">
            {isEdit ? `Editing — ${instructor!.name}` : "New instructor"}
          </p>
          <button onClick={onClose} className="text-[20px] hover:opacity-60">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── BIG PREVIEW ── */}
          <div className="relative h-52 bg-off-black overflow-hidden">
            <motion.img
              key={previewSrc}
              src={previewSrc}
              alt="preview"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 w-full h-full ${
                tab === "photo" && photoUrl ? "object-cover grayscale contrast-110" : "object-contain p-12"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-off-black/90 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-5 pointer-events-none">
              <p className="text-[28px] leading-none text-pure-white">{name || "Instructor name"}</p>
              <p className="mt-1.5 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pure-white animate-pulse" />
                {voiceId} · {subject}
              </p>
            </div>
            <div className="absolute top-3 right-4 font-mono tracking-mono-sm text-[10px] uppercase text-pure-white/60">
              FIG. PREVIEW
            </div>
          </div>

          <div className="px-6 py-6 space-y-7">

            {/* name */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">Name *</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria"
                className="w-full font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black"
              />
            </div>

            {/* subject */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">Subject *</label>
              <div className="flex flex-wrap gap-1.5">
                {["Mathematics", "Science", "Language Arts", "History", "General"].map((s) => (
                  <button key={s} onClick={() => setSubject(s)}
                    className={`font-mono tracking-mono text-[12px] uppercase px-3 py-1.5 rounded-[3px] border transition-colors ${
                      subject === s ? "bg-off-black text-pure-white border-off-black" : "border-absolute-black hover:bg-light-concrete/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* bio */}
            <div>
              <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-2">Bio</label>
              <textarea
                value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
                placeholder="Short line shown to students…"
                className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black resize-none"
              />
            </div>

            {/* ── AVATAR SECTION ── */}
            <div>
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-3">Avatar</p>

              {/* tab toggle */}
              <div className="flex gap-1 mb-5 border border-absolute-black rounded-[3px] p-0.5">
                {(["bot", "photo"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 font-mono tracking-mono text-[12px] uppercase py-1.5 rounded-[2px] transition-colors ${
                      tab === t ? "bg-off-black text-pure-white" : "text-absolute-black hover:bg-light-concrete/40"
                    }`}
                  >
                    {t === "bot" ? "⊕ Bot avatar" : "⊙ Photo URL"}
                  </button>
                ))}
              </div>

              {tab === "bot" && (
                <div className="space-y-5">
                  {/* style picker */}
                  <div>
                    <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-3">Style</p>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_STYLES.map((s) => {
                        const active = avatarStyle === s.id;
                        return (
                          <motion.button
                            key={s.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setAvatarStyle(s.id)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-[3px] border transition-colors ${
                              active ? "border-absolute-black bg-off-black/5" : "border-transparent hover:border-absolute-black/30"
                            }`}
                          >
                            <img
                              src={dicebearUrl(s.id, effectiveSeed)}
                              alt={s.label}
                              className="w-10 h-10 rounded-full bg-off-black"
                            />
                            <span className={`font-mono tracking-mono-sm text-[10px] uppercase ${active ? "text-absolute-black" : "text-off-black/50"}`}>
                              {s.label}
                            </span>
                            {active && <span className="w-1 h-1 rounded-full bg-off-black" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* seed */}
                  <div>
                    <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-2">
                      Seed — any word changes the face
                    </label>
                    <input
                      value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)}
                      placeholder={name.toLowerCase() || "type anything…"}
                      className="w-full font-mono text-[15px] px-3 py-2 border border-absolute-black rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black"
                    />
                    {/* seed presets */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {SEED_PRESETS.map((p) => (
                        <button key={p} onClick={() => setAvatarSeed(p)}
                          className={`font-mono tracking-mono-sm text-[10px] uppercase px-2 py-0.5 rounded-[2px] border transition-colors ${
                            effectiveSeed === p ? "bg-off-black text-pure-white border-off-black" : "border-absolute-black/30 text-off-black/50 hover:border-absolute-black"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* live grid — same seed, all styles */}
                  <div>
                    <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40 mb-2">
                      All styles with seed "{effectiveSeed}"
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {AVATAR_STYLES.map((s) => (
                        <motion.button key={s.id} whileTap={{ scale: 0.9 }} onClick={() => setAvatarStyle(s.id)}
                          title={s.label}
                          className={`rounded-full border-2 transition-colors ${avatarStyle === s.id ? "border-absolute-black" : "border-transparent"}`}
                        >
                          <img src={dicebearUrl(s.id, effectiveSeed)} className="w-9 h-9 rounded-full bg-off-black" alt={s.label} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "photo" && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono tracking-mono-sm text-[10px] uppercase text-off-black/50 mb-2">
                      Photo URL — Unsplash, your own CDN, etc.
                    </label>
                    <input
                      value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/…"
                      className="w-full font-mono text-[13px] px-3 py-2 border border-absolute-black rounded-[3px] focus:outline-none focus:ring-1 focus:ring-absolute-black"
                    />
                  </div>
                  {photoUrl && (
                    <div className="flex gap-3 items-center">
                      <img src={photoUrl} alt="preview" className="w-16 h-16 rounded-full object-cover grayscale border border-absolute-black" />
                      <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60">
                        Photo will be grayscale to match the industrial aesthetic.
                      </p>
                    </div>
                  )}
                  <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/40">
                    Leave blank to fall back to the bot avatar.
                  </p>
                </div>
              )}
            </div>

            {/* ── VOICE ── */}
            <div>
              <p className="font-mono tracking-mono-sm text-[10px] uppercase text-off-black/60 mb-3">Kokoro voice *</p>
              <div className="space-y-1.5">
                {VOICES.map((v) => (
                  <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVoiceId(v.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[3px] border text-left transition-colors ${
                      voiceId === v.id
                        ? "bg-off-black text-pure-white border-off-black"
                        : "border-absolute-black/40 hover:bg-light-concrete/40"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 shrink-0 ${voiceId === v.id ? "bg-pure-white border-pure-white" : "border-absolute-black/40"}`} />
                    <span className="font-mono tracking-mono text-[12px] uppercase flex-1">{v.label}</span>
                    <span className={`font-mono tracking-mono-sm text-[10px] ${voiceId === v.id ? "text-pure-white/70" : "text-off-black/50"}`}>{v.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {err && (
              <p className="font-mono tracking-mono text-[12px] uppercase border border-absolute-black p-3">⚠ {err}</p>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 border-t border-absolute-black px-6 py-4 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={busy}
            className="flex-1 font-mono tracking-mono text-[12px] uppercase px-4 py-3 bg-off-black text-pure-white rounded-[3px] hover:bg-absolute-black transition-colors disabled:opacity-40"
          >
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create instructor →"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="font-mono tracking-mono text-[12px] uppercase px-4 py-3 border border-absolute-black rounded-[3px] hover:bg-light-concrete/40 transition-colors"
          >
            Cancel
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}
