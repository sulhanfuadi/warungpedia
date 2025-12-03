import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

const PRODUCT_BUCKET =
  process.env.SUPABASE_PRODUCT_BUCKET || "product-uploads";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

type IncomingVariant = {
  option_group: string;
  name: string;
  price: number | null;
  stock: number;
  metadata?: Record<string, unknown>;
  imageKey?: string;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: token tidak ditemukan" },
        { status: 401 },
      );
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(
      token,
    );
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: "Unauthorized: token tidak valid" },
        { status: 401 },
      );
    }

    const sellerId = authUser.user.id;
    const { data: sellerRecord, error: sellerError } = await supabaseAdmin
      .from("sellers")
      .select("status, role")
      .eq("id", sellerId)
      .single();

    if (sellerError || !sellerRecord) {
      return NextResponse.json(
        { error: "Seller tidak ditemukan" },
        { status: 403 },
      );
    }

    const role =
      (authUser.user.user_metadata as Record<string, unknown>)?.role ||
      (authUser.user.app_metadata as Record<string, unknown>)?.role ||
      sellerRecord.role;

    if (role && role !== "seller") {
      return NextResponse.json(
        { error: "Akun ini bukan seller" },
        { status: 403 },
      );
    }

    if (sellerRecord.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Akun seller belum aktif atau disuspend" },
        { status: 403 },
      );
    }

    const name = formData.get("name");
    const category = formData.get("category");
    const description = formData.get("description");
    const price = parseNumber(formData.get("price"));
    const stock = parseNumber(formData.get("stock"));
    const condition = (formData.get("condition") as string) || "BARU";
    const specsRaw = (formData.get("specifications") as string) || "{}";
    const mainPhoto = formData.get("mainPhoto");
    const galleryEntries = formData.getAll("galleryPhotos");
    const variantsRaw = formData.get("variants") as string | null;

    if (
      !sellerId ||
      typeof sellerId !== "string" ||
      !name ||
      typeof name !== "string" ||
      !category ||
      typeof category !== "string" ||
      price === null ||
      stock === null ||
      !(mainPhoto instanceof File)
    ) {
      return NextResponse.json(
        { error: "Data tidak lengkap atau tidak valid" },
        { status: 400 },
      );
    }

    if (!["BARU", "BEKAS"].includes(condition)) {
      return NextResponse.json(
        { error: "Kondisi produk tidak valid" },
        { status: 400 },
      );
    }

    let specifications: Record<string, string> = {};
    try {
      const parsed = JSON.parse(specsRaw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        specifications = parsed;
      }
    } catch {
      return NextResponse.json(
        { error: "Format specifications harus JSON" },
        { status: 400 },
      );
    }

    let variants: IncomingVariant[] = [];
    if (variantsRaw) {
      try {
        const parsed = JSON.parse(variantsRaw);
        if (Array.isArray(parsed)) {
          variants = parsed.map((v) => ({
            option_group: typeof v.option_group === "string" ? v.option_group.trim() : "",
            name: typeof v.name === "string" ? v.name.trim() : "",
            price: typeof v.price === "number" && Number.isFinite(v.price) ? v.price : null,
            stock:
              typeof v.stock === "number" && Number.isFinite(v.stock)
                ? v.stock
                : Number.parseInt(String(v.stock ?? 0), 10) || 0,
            metadata:
              v.metadata && typeof v.metadata === "object" && !Array.isArray(v.metadata)
                ? v.metadata
                : undefined,
            imageKey: typeof v.imageKey === "string" ? v.imageKey : undefined,
          }));
        } else {
          return NextResponse.json(
            { error: "Format variants harus array" },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Format variants harus JSON" },
          { status: 400 },
        );
      }
    }

    for (const v of variants) {
      if (!v.option_group || !v.name) {
        return NextResponse.json(
          { error: "Setiap varian harus memiliki option_group dan name" },
          { status: 400 },
        );
      }
    }

    const productId = randomUUID();

    const mainExt = (mainPhoto.name.split(".").pop() || "jpg").toLowerCase();
    const mainPath = `${sellerId}/${productId}/main.${mainExt}`;

    const { error: uploadMainError } = await supabaseAdmin.storage
      .from(PRODUCT_BUCKET)
      .upload(mainPath, mainPhoto, {
        cacheControl: "3600",
        upsert: true,
        contentType: mainPhoto.type || "application/octet-stream",
      });

    if (uploadMainError) {
      return NextResponse.json(
        { error: "Gagal mengunggah foto utama", details: uploadMainError.message },
        { status: 500 },
      );
    }

    const { data: mainPublic } = supabaseAdmin.storage
      .from(PRODUCT_BUCKET)
      .getPublicUrl(mainPath);
    const main_photo_path = mainPublic.publicUrl;

    const gallery_photos: string[] = [];
    for (const entry of galleryEntries) {
      if (!(entry instanceof File)) continue;
      const ext = (entry.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${sellerId}/${productId}/gallery/${randomUUID()}.${ext}`;

      const { error: galleryError } = await supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .upload(path, entry, {
          cacheControl: "3600",
          upsert: true,
          contentType: entry.type || "application/octet-stream",
        });

      if (galleryError) {
        return NextResponse.json(
          { error: "Gagal mengunggah salah satu gallery", details: galleryError.message },
          { status: 500 },
        );
      }

      const { data: galleryUrl } = supabaseAdmin.storage
        .from(PRODUCT_BUCKET)
        .getPublicUrl(path);
      gallery_photos.push(galleryUrl.publicUrl);
    }

    const basePayload = {
      id: productId,
      seller_id: sellerId,
      name,
      description: description || null,
      category,
      price,
      stock,
      condition,
      specifications,
      main_photo_path,
    };

    const payloadWithGallery = { ...basePayload, gallery_photos };

    let insertError = null;
    let inserted = false;

    // Coba insert dengan gallery_photos (untuk schema terbaru)
    const withGallery = await supabaseAdmin.from("products").insert(payloadWithGallery);
    insertError = withGallery.error ?? null;
    inserted = !withGallery.error;

    // Fallback jika kolom gallery_photos tidak ada
    if (insertError && insertError.message?.includes("gallery_photos")) {
      const withoutGallery = await supabaseAdmin.from("products").insert(basePayload);
      insertError = withoutGallery.error ?? null;
      inserted = !withoutGallery.error;
    }

    if (!inserted) {
      return NextResponse.json(
        { error: "Gagal menyimpan produk", details: insertError?.message },
        { status: 500 },
      );
    }

    // Insert variants if provided
    for (let idx = 0; idx < variants.length; idx++) {
      const v = variants[idx];
      const variantId = randomUUID();
      let image_path: string | null = null;

      const imageField = v.imageKey || `variantImage_${idx}`;
      const variantImage = formData.get(imageField);
      if (variantImage instanceof File) {
        const ext = (variantImage.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${sellerId}/${productId}/variants/${variantId}.${ext}`;

        const { error: variantUploadError } = await supabaseAdmin.storage
          .from(PRODUCT_BUCKET)
          .upload(path, variantImage, {
            cacheControl: "3600",
            upsert: true,
            contentType: variantImage.type || "application/octet-stream",
          });

        if (variantUploadError) {
          return NextResponse.json(
            {
              error: "Gagal mengunggah gambar varian",
              details: variantUploadError.message,
            },
            { status: 500 },
          );
        }

        const { data: variantPublic } = supabaseAdmin.storage
          .from(PRODUCT_BUCKET)
          .getPublicUrl(path);
        image_path = variantPublic.publicUrl;
      }

      const variantBase = {
        id: variantId,
        product_id: productId,
        option_group: v.option_group,
        name: v.name,
        price: v.price,
        stock: v.stock ?? 0,
      };

      const variantWithMeta = { ...variantBase, metadata: v.metadata || {}, image_path };

      let variantError = null;
      let variantInserted = false;

      const withMeta = await supabaseAdmin.from("product_variants").insert(variantWithMeta);
      variantError = withMeta.error ?? null;
      variantInserted = !withMeta.error;

      if (
        variantError &&
        (variantError.message?.includes("metadata") || variantError.message?.includes("image_path"))
      ) {
        const withoutMeta = await supabaseAdmin
          .from("product_variants")
          .insert(variantBase);
        variantError = withoutMeta.error ?? null;
        variantInserted = !withoutMeta.error;
      }

      if (!variantInserted) {
        return NextResponse.json(
          { error: "Gagal menyimpan varian", details: variantError?.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: "Produk berhasil dibuat", productId },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(err) },
      { status: 500 },
    );
  }
}
