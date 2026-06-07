import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const characterId = formData.get("character_id");
    const file = formData.get("avatar");

    if (!characterId) {
      return NextResponse.json({ error: "character_id wajib diisi." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "File avatar wajib diisi." }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format avatar harus PNG, JPG, JPEG, atau WEBP." },
        { status: 400 }
      );
    }

    const maxSize = 3 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran avatar maksimal 3MB." },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop() || "png";
    const filePath = `${characterId}/${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("character-avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Gagal upload avatar." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("character-avatars")
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          character_id: characterId,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "character_id" }
      );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Avatar terupload, tapi profile gagal update." },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("characters")
      .update({ avatar_url: avatarUrl })
      .eq("id", characterId);

    return NextResponse.json({
      ok: true,
      message: "Avatar berhasil diupload.",
      avatar_url: avatarUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal upload avatar." },
      { status: 500 }
    );
  }
}
