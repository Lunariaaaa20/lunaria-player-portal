"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY_CLAIM = "lunaria_profile_claim_code";
const STORAGE_KEY_PROFILE_ID = "lunaria_profile_id";

const emptyForm = {
  quote: "",
  age: "",
  backstory: "",
  personality: "",
  appearance: "",
};

export default function ProfilePage() {
  const [claimCode, setClaimCode] = useState("");
  const [profileId, setProfileId] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const displayName = useMemo(() => {
    if (!profile) return "Unclaimed Profile";
    return (
      profile.name ||
      profile.character_name ||
      profile.username ||
      profile.display_name ||
      "Lunaria Adventurer"
    );
  }, [profile]);

  useEffect(() => {
    const savedClaim = localStorage.getItem(STORAGE_KEY_CLAIM) || "";
    const savedProfileId = localStorage.getItem(STORAGE_KEY_PROFILE_ID) || "";

    setClaimCode(savedClaim);
    setProfileId(savedProfileId);

    if (savedClaim) {
      loadProfile(savedClaim, savedProfileId);
    }
  }, []);

  function applyProfileToForm(nextProfile) {
    setProfile(nextProfile);
    setProfileId(nextProfile?.id || "");

    setForm({
      quote: nextProfile?.quote || "",
      age: nextProfile?.age ? String(nextProfile.age) : "",
      backstory: nextProfile?.backstory || "",
      personality: nextProfile?.personality || "",
      appearance: nextProfile?.appearance || "",
    });

    setAvatarPreview(nextProfile?.avatar_url || "");

    if (nextProfile?.id) {
      localStorage.setItem(STORAGE_KEY_PROFILE_ID, nextProfile.id);
    }
  }

  async function loadProfile(nextClaimCode = claimCode, nextProfileId = profileId) {
    const cleanClaim = String(nextClaimCode || "").trim();
    const cleanProfileId = String(nextProfileId || "").trim();

    if (!cleanClaim) {
      setMessage("Masukkan claim code dulu.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      params.set("claim_code", cleanClaim);
      if (cleanProfileId) params.set("profile_id", cleanProfileId);

      const response = await fetch(`/api/profile/save?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal memuat profile.");
      }

      localStorage.setItem(STORAGE_KEY_CLAIM, cleanClaim);
      applyProfileToForm(payload.profile);
      setMessage("Profile berhasil dimuat dari Supabase.");
    } catch (error) {
      setMessage(error.message || "Gagal memuat profile.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function onAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(profile?.avatar_url || "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Avatar harus berupa file gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran avatar maksimal 5MB.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(event) {
    event.preventDefault();

    const cleanClaim = String(claimCode || "").trim();

    if (!cleanClaim) {
      setMessage("Claim code wajib diisi.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const body = new FormData();
      body.set("claim_code", cleanClaim);

      if (profileId) {
        body.set("profile_id", profileId);
      }

      body.set("quote", form.quote || "");
      body.set("age", form.age || "");
      body.set("backstory", form.backstory || "");
      body.set("personality", form.personality || "");
      body.set("appearance", form.appearance || "");

      if (avatarFile) {
        body.set("avatar", avatarFile);
      }

      const response = await fetch("/api/profile/save", {
        method: "POST",
        body,
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal menyimpan profile.");
      }

      localStorage.setItem(STORAGE_KEY_CLAIM, cleanClaim);
      applyProfileToForm(payload.profile);
      setAvatarFile(null);
      setMessage("Profile berhasil disimpan permanen.");
    } catch (error) {
      setMessage(error.message || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="lunaria-shell">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #07080d;
          color: #f5f1e8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .lunaria-shell {
          min-height: 100vh;
          padding: 28px 18px 42px;
          background:
            radial-gradient(circle at top left, rgba(214, 178, 91, 0.16), transparent 32%),
            radial-gradient(circle at top right, rgba(91, 135, 214, 0.10), transparent 28%),
            linear-gradient(135deg, #090a10 0%, #10131c 46%, #050507 100%);
        }

        .lunaria-wrap {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .hero-card,
        .profile-card,
        .form-card,
        .claim-card,
        .message-card {
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.045);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
        }

        .hero-card {
          border-radius: 28px;
          padding: 24px;
          margin-bottom: 18px;
        }

        .eyebrow {
          margin: 0;
          color: rgba(238, 207, 132, 0.78);
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .title {
          margin: 10px 0 8px;
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1.02;
          letter-spacing: -0.04em;
          font-weight: 950;
        }

        .subtitle {
          max-width: 760px;
          margin: 0;
          color: rgba(245, 241, 232, 0.66);
          font-size: 15px;
          line-height: 1.7;
        }

        .grid {
          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 18px;
          align-items: start;
        }

        .profile-card,
        .form-card {
          border-radius: 28px;
          padding: 20px;
        }

        .avatar-box {
          width: 178px;
          height: 178px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid rgba(238, 207, 132, 0.25);
          background: rgba(0, 0, 0, 0.38);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(245, 241, 232, 0.42);
          font-size: 13px;
          text-align: center;
        }

        .avatar-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .profile-name {
          margin: 16px 0 4px;
          text-align: center;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .profile-rank {
          margin: 0 0 16px;
          text-align: center;
          color: rgba(245, 241, 232, 0.45);
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-weight: 800;
        }

        .claim-card {
          border-radius: 22px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.22);
        }

        .label {
          display: block;
          margin-bottom: 8px;
          color: rgba(245, 241, 232, 0.52);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .input,
        .textarea,
        .file-input {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.11);
          outline: none;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.34);
          color: #f5f1e8;
          padding: 12px 13px;
          font-size: 14px;
        }

        .textarea {
          min-height: 112px;
          resize: vertical;
          line-height: 1.6;
        }

        .input:focus,
        .textarea:focus {
          border-color: rgba(238, 207, 132, 0.55);
          box-shadow: 0 0 0 4px rgba(238, 207, 132, 0.08);
        }

        .field-grid {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .field {
          margin-bottom: 14px;
        }

        .hint {
          margin: 8px 0 0;
          color: rgba(245, 241, 232, 0.42);
          font-size: 12px;
          line-height: 1.5;
        }

        .btn-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .btn {
          border: 0;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f4d98b, #b8862f);
          color: #100c05;
        }

        .btn-secondary {
          border: 1px solid rgba(255, 255, 255, 0.11);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f1e8;
        }

        .btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .message-card {
          border-radius: 18px;
          padding: 12px 14px;
          margin-top: 14px;
          color: rgba(245, 241, 232, 0.78);
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 820px) {
          .lunaria-shell {
            padding: 18px 12px 34px;
          }

          .hero-card,
          .profile-card,
          .form-card {
            border-radius: 22px;
            padding: 16px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .field-grid {
            grid-template-columns: 1fr;
          }

          .avatar-box {
            width: 140px;
            height: 140px;
            border-radius: 24px;
          }

          .title {
            font-size: 32px;
          }

          .subtitle {
            font-size: 13px;
          }
        }
      `}</style>

      <section className="lunaria-wrap">
        <div className="hero-card">
          <p className="eyebrow">Lunaria Player Portal</p>
          <h1 className="title">Profile Editor</h1>
          <p className="subtitle">
            Simpan avatar, quote, age, backstory, personality, dan appearance secara permanen ke Supabase.
            Gunakan claim code untuk memuat dan menyimpan profile.
          </p>
        </div>

        <div className="grid">
          <aside className="profile-card">
            <div className="avatar-box">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" />
              ) : (
                <span>No Avatar</span>
              )}
            </div>

            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-rank">
              {profile?.guild_rank || profile?.rank || "Profile"}
            </p>

            <div className="claim-card">
              <label className="label">Claim Code</label>
              <input
                value={claimCode}
                onChange={(event) => setClaimCode(event.target.value)}
                placeholder="Masukkan claim code"
                className="input"
              />

              <div className="btn-row">
                <button
                  type="button"
                  onClick={() => loadProfile()}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  {loading ? "Loading..." : "Load Profile"}
                </button>
              </div>
            </div>

            {message ? <div className="message-card">{message}</div> : null}
          </aside>

          <form onSubmit={saveProfile} className="form-card">
            <div className="field">
              <label className="label">Avatar</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onAvatarChange}
                className="file-input"
              />
              <p className="hint">Format: PNG, JPG, WEBP, GIF. Maksimal 5MB.</p>
            </div>

            <div className="field-grid">
              <div className="field">
                <label className="label">Age</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.age}
                  onChange={(event) => updateField("age", event.target.value)}
                  placeholder="Contoh: 19"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Quote</label>
                <input
                  value={form.quote}
                  onChange={(event) => updateField("quote", event.target.value)}
                  placeholder="Quote karakter"
                  maxLength={280}
                  className="input"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Personality</label>
              <textarea
                value={form.personality}
                onChange={(event) => updateField("personality", event.target.value)}
                placeholder="Sifat, kebiasaan, cara bicara, dan karakter mental."
                className="textarea"
              />
            </div>

            <div className="field">
              <label className="label">Appearance</label>
              <textarea
                value={form.appearance}
                onChange={(event) => updateField("appearance", event.target.value)}
                placeholder="Deskripsi fisik, pakaian, aura, dan ciri visual."
                className="textarea"
              />
            </div>

            <div className="field">
              <label className="label">Backstory</label>
              <textarea
                value={form.backstory}
                onChange={(event) => updateField("backstory", event.target.value)}
                placeholder="Latar belakang karakter."
                className="textarea"
                style={{ minHeight: 150 }}
              />
            </div>

            <div className="btn-row">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Saving..." : "Save Permanent Profile"}
              </button>

              <button
                type="button"
                onClick={() => loadProfile()}
                disabled={loading}
                className="btn btn-secondary"
              >
                Refresh From Supabase
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
