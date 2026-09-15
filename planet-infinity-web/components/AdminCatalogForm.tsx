"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { Upload } from "tus-js-client";
import {
  createCatalogItem,
  createCatalogUploadTarget,
} from "@/app/actions/admin";
import { HIACE_14, seatConfigVehicles, type SeatConfig } from "@/content/trips";
import {
  CATALOG_MEDIA_ACCEPT,
  type CatalogMediaKind,
  validateCatalogMedia,
} from "@/lib/catalog-media";
import { createClient } from "@/lib/supabase/client";
import { BookingFormBuilder } from "@/components/BookingFormBuilder";
import type { BookingFormField } from "@/lib/booking-form";
import type { RequestFormTheme } from "@/lib/request-form";
import {
  DEFAULT_CATALOG_THEME,
  type CatalogChannel,
  type CatalogBackground,
  type CatalogDepth,
  type CatalogExplorerMotion,
  type CatalogFinish,
  type CatalogSurface,
  type CatalogTypography,
  type CatalogVisualTheme,
} from "@/lib/catalog-visual-theme";

const GUIDE_SEAT = 1;
function withGuideSeatReserved(seats: number[] | undefined) {
  return Array.from(new Set([GUIDE_SEAT, ...(seats ?? [])])).sort((a, b) => a - b);
}

type CatalogMedia = {
  hero?: string;
  heroAlt?: string;
  gallery?: { src: string; alt: string; type?: "image" | "video"; poster?: string }[];
  video?: string;
  visualTheme?: CatalogVisualTheme;
  linkedTripSlug?: string;
};

export type CatalogEditorItem = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  destination?: string | null;
  category?: string | null;
  duration_label?: string | null;
  venue?: string | null;
  meeting_point?: string | null;
  return_at?: string | null;
  departure_point?: string | null;
  return_point?: string | null;
  package_label?: string | null;
  accommodation?: string | null;
  transportation?: string | null;
  important_information?: string[] | null;
  ends_at?: string | null;
  departure_at?: string | null;
  starts_at?: string | null;
  price_egp: number | null;
  capacity?: number | null;
  booking_mode: "booking" | "request" | "application";
  application_required: boolean;
  seat_selection_enabled?: boolean;
  seat_config?: SeatConfig | null;
  booking_form_fields?: BookingFormField[] | null;
  request_form_fields?: BookingFormField[] | null;
  request_form_theme?: RequestFormTheme | null;
  payment_proof_required?: boolean;
  song_request_enabled?: boolean;
  media: CatalogMedia | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  document_url: string | null;
  document_label: string | null;
  is_published: boolean;
  is_featured: boolean;
};

type FormMessage = { tone: "success" | "error"; text: string } | null;

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type LogoThemeSuggestion = {
  primary: string;
  secondary: string;
  surface: CatalogSurface;
  background: CatalogBackground;
  typography: CatalogTypography;
  hasTransparency: boolean;
};

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

async function loadLogoImage(file: File) {
  const source = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The logo image could not be opened."));
      nextImage.src = source;
    });
  } finally {
    // The image has decoded before this point, so the temporary URL is no longer needed.
    URL.revokeObjectURL(source);
  }
}

async function prepareLogoUpload(file: File): Promise<{ file: File; extracted: boolean }> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a PNG, JPG or WebP logo image.");
  const image = await loadLogoImage(file);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, 900 / Math.max(longestSide, 1));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("The logo could not be prepared.");
  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  let transparentPixels = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 245) transparentPixels += 1;
  }
  const alreadyTransparent = transparentPixels / (width * height) > .025;

  if (!alreadyTransparent) {
    const border: Array<[number, number, number]> = [];
    const step = Math.max(1, Math.floor(Math.min(width, height) / 90));
    const pushPixel = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      border.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
    };
    for (let x = 0; x < width; x += step) {
      pushPixel(x, 0);
      pushPixel(x, height - 1);
    }
    for (let y = 0; y < height; y += step) {
      pushPixel(0, y);
      pushPixel(width - 1, y);
    }
    const background = border.reduce((sum, colour) => [sum[0] + colour[0], sum[1] + colour[1], sum[2] + colour[2]], [0, 0, 0])
      .map((value) => value / Math.max(border.length, 1));
    const backgroundLightness = (background[0] + background[1] + background[2]) / 3;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const distance = Math.hypot(red - background[0], green - background[1], blue - background[2]);
      const edge = backgroundLightness < 34
        ? Math.max(red, green, blue)
        : backgroundLightness > 224
          ? 255 - Math.min(red, green, blue)
          : distance;
      pixels[index + 3] = Math.round(Math.max(0, Math.min(1, (edge - 16) / 54)) * 255);
    }
    context.putImageData(imageData, 0, 0);
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const preparedPixels = context.getImageData(0, 0, width, height).data;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (preparedPixels[(y * width + x) * 4 + 3] > 18) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("The logo could not be separated from its background.");
  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;
  const output = document.createElement("canvas");
  output.width = 1024;
  output.height = 1024;
  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("The logo could not be prepared.");
  const fit = Math.min(900 / contentWidth, 900 / contentHeight);
  const drawWidth = contentWidth * fit;
  const drawHeight = contentHeight * fit;
  outputContext.drawImage(canvas, minX, minY, contentWidth, contentHeight, (1024 - drawWidth) / 2, (1024 - drawHeight) / 2, drawWidth, drawHeight);
  const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png", .96));
  if (!blob) throw new Error("The logo could not be converted to PNG.");
  const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-") || "experience-logo";
  return { file: new File([blob], `${cleanName}-extracted.png`, { type: "image/png" }), extracted: !alreadyTransparent };
}

async function analyseLogo(file: File): Promise<LogoThemeSuggestion> {
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The logo could not be analysed."));
      nextImage.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 72;
    canvas.height = 72;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The logo could not be analysed.");
    context.clearRect(0, 0, 72, 72);
    context.drawImage(image, 0, 0, 72, 72);
    const pixels = context.getImageData(0, 0, 72, 72).data;
    const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();
    let transparent = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3];
      if (alpha < 28) {
        transparent += 1;
        continue;
      }
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max ? (max - min) / max : 0;
      const lightness = (max + min) / 510;
      if (lightness > .96 || lightness < .035) continue;
      const key = `${Math.round(red / 28)}-${Math.round(green / 28)}-${Math.round(blue / 28)}`;
      const weight = 1 + saturation * 2.4;
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += weight;
      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;
      buckets.set(key, bucket);
    }
    const colours = [...buckets.values()]
      .map((bucket) => ({ red: bucket.red / bucket.count, green: bucket.green / bucket.count, blue: bucket.blue / bucket.count, score: bucket.count }))
      .sort((a, b) => b.score - a.score);
    const primary = colours[0] ?? { red: 245, green: 155, blue: 35, score: 1 };
    const secondary = colours.find((colour) => Math.hypot(colour.red - primary.red, colour.green - primary.green, colour.blue - primary.blue) > 92)
      ?? { red: Math.min(255, primary.blue + 42), green: Math.min(255, primary.green + 28), blue: Math.min(255, primary.red + 18), score: 1 };
    const luminance = (.2126 * primary.red + .7152 * primary.green + .0722 * primary.blue) / 255;
    const max = Math.max(primary.red, primary.green, primary.blue);
    const min = Math.min(primary.red, primary.green, primary.blue);
    const saturation = max ? (max - min) / max : 0;
    const hueFamily = primary.blue > primary.red * 1.12
      ? "cool"
      : primary.red > primary.blue * 1.25 && primary.green > primary.blue * .9
        ? "warm"
        : "mixed";
    return {
      primary: rgbToHex(primary.red, primary.green, primary.blue),
      secondary: rgbToHex(secondary.red, secondary.green, secondary.blue),
      surface: luminance > .86 ? "dark" : "light",
      background: hueFamily === "cool" ? "sea-blur" : hueFamily === "warm" ? "desert" : luminance < .3 ? "night" : "clean",
      typography: hueFamily === "warm" ? "editorial" : saturation > .55 ? "rounded" : luminance < .35 ? "technical" : "brand",
      hasTransparency: transparent / (pixels.length / 4) > .04,
    };
  } finally {
    URL.revokeObjectURL(source);
  }
}

function editorSeatConfig(value: SeatConfig | null | undefined): SeatConfig {
  if (value?.layout && Array.isArray(value.layout.rows) && value.layout.rows.length) {
    return { ...value, unavailable: withGuideSeatReserved(value.unavailable) };
  }
  return { layout: HIACE_14, unavailable: [GUIDE_SEAT] };
}

function editorSeatConfigWithFleet(value: SeatConfig | null | undefined, requestedCount: number): SeatConfig {
  const base = editorSeatConfig(value);
  const existing = seatConfigVehicles(base);
  const count = Math.min(8, Math.max(1, Math.floor(requestedCount) || 1));
  return {
    layout: base.layout,
    unavailable: withGuideSeatReserved(base.unavailable),
    vehicles: Array.from({ length: count }, (_, index) => {
      const existingVehicle = existing[index];
      return {
        id: `hiace-${index + 1}`,
        label: `Hiace ${index + 1}`,
        layout: existingVehicle?.layout ?? base.layout,
        unavailable: withGuideSeatReserved(existingVehicle?.unavailable ?? base.unavailable),
      };
    }),
  };
}

function UploadControl({
  kind,
  label,
  accept,
  multiple = false,
  disabled,
  onFiles,
}: {
  kind: CatalogMediaKind;
  label: string;
  accept?: string;
  multiple?: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => Promise<void>;
}) {
  return (
    <label className="pi-admin-upload">
      <span>{disabled ? "Uploading…" : label}</span>
      <input
        type="file"
        accept={accept ?? CATALOG_MEDIA_ACCEPT[kind]}
        multiple={multiple}
        disabled={disabled}
        onChange={async (event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          if (files.length) await onFiles(files);
        }}
      />
    </label>
  );
}

export function AdminCatalogForm({
  kind,
  item,
}: {
  kind: "trips" | "events";
  item?: CatalogEditorItem;
}) {
  const isTrip = kind === "trips";
  const label = isTrip ? "trip" : "event";
  const initialMedia = item?.media ?? {};

  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(
    item?.short_description ?? "",
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [destinationOrCategory, setDestinationOrCategory] = useState(
    (isTrip ? item?.destination : item?.category) ?? "",
  );
  const [durationOrVenue, setDurationOrVenue] = useState(
    (isTrip ? item?.duration_label : item?.venue) ?? "",
  );
  const [meetingPoint, setMeetingPoint] = useState(
    isTrip ? item?.meeting_point ?? "" : "",
  );
  const [date, setDate] = useState(
    (item?.departure_at ?? item?.starts_at ?? "").slice(0, 16),
  );
  const [endDate, setEndDate] = useState((item?.return_at ?? item?.ends_at ?? "").slice(0, 16));
  const [departurePoint, setDeparturePoint] = useState(item?.departure_point ?? "");
  const [returnPoint, setReturnPoint] = useState(item?.return_point ?? "");
  const [packageLabel, setPackageLabel] = useState(item?.package_label ?? "");
  const [accommodation, setAccommodation] = useState(item?.accommodation ?? "");
  const [transportation, setTransportation] = useState(item?.transportation ?? "");
  const [importantInformation, setImportantInformation] = useState((item?.important_information ?? []).join("\n"));
  const [price, setPrice] = useState(item?.price_egp?.toString() ?? "");
  const [capacity, setCapacity] = useState(item?.capacity?.toString() ?? "");
  const [bookingMode, setBookingMode] = useState<
    "booking" | "request" | "application"
  >(item?.booking_mode ?? "booking");
  const [applicationRequired, setApplicationRequired] = useState(
    item?.application_required ?? false,
  );
  const [seatSelectionEnabled, setSeatSelectionEnabled] = useState(
    item?.seat_selection_enabled ?? false,
  );
  const [vehicleCount, setVehicleCount] = useState(() => seatConfigVehicles(editorSeatConfig(item?.seat_config)).length);
  const [songRequestEnabled, setSongRequestEnabled] = useState(
    item?.song_request_enabled ?? false,
  );
  const [bookingFormFields, setBookingFormFields] = useState<BookingFormField[]>(
    item?.booking_form_fields ?? [],
  );
  const [requestFormFields, setRequestFormFields] = useState<BookingFormField[]>(
    item?.request_form_fields ?? [],
  );
  const [requestFormStyle, setRequestFormStyle] = useState<NonNullable<RequestFormTheme["style"]>>(
    item?.request_form_theme?.style ?? "immersive",
  );
  const [catalogChannels, setCatalogChannels] = useState<CatalogChannel[]>(
    initialMedia.visualTheme?.channels ?? [isTrip ? "trips" : "events"],
  );
  const [paymentProofRequired, setPaymentProofRequired] = useState(
    item?.payment_proof_required ?? true,
  );
  const [inclusions, setInclusions] = useState(
    (item?.inclusions ?? []).join("\n"),
  );
  const [exclusions, setExclusions] = useState(
    (item?.exclusions ?? []).join("\n"),
  );
  const [hero, setHero] = useState(initialMedia.hero ?? "");
  const [heroAlt, setHeroAlt] = useState(initialMedia.heroAlt ?? "");
  const [video, setVideo] = useState(initialMedia.video ?? "");
  const [linkedTripSlug, setLinkedTripSlug] = useState(initialMedia.linkedTripSlug ?? "");
  const [gallery, setGallery] = useState(initialMedia.gallery ?? []);
  const [galleryUrl, setGalleryUrl] = useState("");
  const initialTheme = { ...DEFAULT_CATALOG_THEME, ...initialMedia.visualTheme };
  const [visualLogo, setVisualLogo] = useState(initialTheme.logo ?? "");
  const [visualLogoAlt, setVisualLogoAlt] = useState(initialTheme.logoAlt ?? "");
  const [visualPrimary, setVisualPrimary] = useState(initialTheme.primaryColor);
  const [visualSecondary, setVisualSecondary] = useState(initialTheme.secondaryColor);
  const [visualSurface, setVisualSurface] = useState<CatalogSurface>(initialTheme.surface);
  const [visualFinish, setVisualFinish] = useState<CatalogFinish>(initialTheme.finish);
  const [visualBackground, setVisualBackground] = useState<CatalogBackground>(initialTheme.background);
  const [visualDepth, setVisualDepth] = useState<CatalogDepth>(initialTheme.depth);
  const [explorerScale, setExplorerScale] = useState(initialTheme.explorerScale);
  const [explorerMotion, setExplorerMotion] = useState<CatalogExplorerMotion>(initialTheme.explorerMotion);
  const [visualTypography, setVisualTypography] = useState<CatalogTypography>(initialTheme.typography);
  const [visualBackgroundImage, setVisualBackgroundImage] = useState(initialTheme.backgroundImage ?? "");
  const [documentUrl, setDocumentUrl] = useState(item?.document_url ?? "");
  const [documentLabel, setDocumentLabel] = useState(
    item?.document_label ?? `${isTrip ? "Trip" : "Event"} information PDF`,
  );
  const [published, setPublished] = useState(item?.is_published ?? false);
  const [featured, setFeatured] = useState(item?.is_featured ?? false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<FormMessage>(null);
  const [themeSuggestionMessage, setThemeSuggestionMessage] = useState<FormMessage>(null);
  const [message, setMessage] = useState<FormMessage>(null);
  const [pending, startTransition] = useTransition();

  async function uploadOne(file: File, mediaKind: CatalogMediaKind) {
    const mimeType = mediaKind === "video" && /\.mov$/i.test(file.name)
      ? "video/quicktime"
      : file.type;
    const validationError = validateCatalogMedia(mediaKind, mimeType, file.size);
    if (validationError) throw new Error(validationError);

    const target = await createCatalogUploadTarget({
      kind: mediaKind,
      mimeType,
      size: file.size,
    });
    if (!target.ok) throw new Error(target.error);

    if (mediaKind === "video" && file.size > 6 * 1024 * 1024) {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!projectUrl) throw new Error("Video storage is not configured.");
      const directStorageUrl = projectUrl.replace(/^(https:\/\/[^.]+)\.supabase\.co$/i, "$1.storage.supabase.co");
      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: `${directStorageUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: { "x-signature": target.token },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          chunkSize: 6 * 1024 * 1024,
          metadata: {
            bucketName: target.bucket,
            objectName: target.path,
            contentType: mimeType,
            cacheControl: "31536000",
          },
          onError: reject,
          onSuccess: () => resolve(),
        });
        upload.start();
      });
      return target.publicUrl;
    }

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(target.bucket)
      .uploadToSignedUrl(target.path, target.token, file, {
        cacheControl: "31536000",
        contentType: mimeType,
      });

    if (error) throw new Error("The file could not be uploaded. Please try again.");
    return target.publicUrl;
  }

  async function uploadFiles(
    files: File[],
    mediaKind: CatalogMediaKind,
    onUploaded: (url: string, file: File) => void,
  ) {
    setUploading(true);
    setUploadMessage(null);
    try {
      for (const file of files) {
        const url = await uploadOne(file, mediaKind);
        onUploaded(url, file);
      }
      setUploadMessage({
        tone: "success",
        text: files.length === 1 ? "File uploaded." : `${files.length} files uploaded.`,
      });
    } catch (error) {
      setUploadMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The upload failed.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function uploadAccommodationOptionPhoto(fieldId: string, optionId: string, files: File[]) {
    await uploadFiles(files.slice(0, 1), "image", (url) => {
      setBookingFormFields((current) => current.map((field) => field.id === fieldId
        ? { ...field, options: (field.options ?? []).map((option) => option.id === optionId ? { ...option, stayGallery: Array.from(new Set([...(option.stayGallery ?? []), url])) } : option) }
        : field));
    });
  }

  function resetNewItem() {
    setTitle("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setDestinationOrCategory("");
    setDurationOrVenue("");
    setMeetingPoint("");
    setDate("");
    setEndDate("");
    setDeparturePoint("");
    setReturnPoint("");
    setPackageLabel("");
    setAccommodation("");
    setTransportation("");
    setImportantInformation("");
    setPrice("");
    setCapacity("");
    setBookingMode("booking");
    setApplicationRequired(false);
    setSeatSelectionEnabled(false);
    setVehicleCount(1);
    setSongRequestEnabled(false);
    setBookingFormFields([]);
    setRequestFormFields([]);
    setRequestFormStyle("immersive");
    setPaymentProofRequired(true);
    setInclusions("");
    setExclusions("");
    setHero("");
    setHeroAlt("");
    setVideo("");
    setLinkedTripSlug("");
    setGallery([]);
    setGalleryUrl("");
    setVisualLogo("");
    setVisualLogoAlt("");
    setVisualPrimary(DEFAULT_CATALOG_THEME.primaryColor);
    setVisualSecondary(DEFAULT_CATALOG_THEME.secondaryColor);
    setVisualSurface(DEFAULT_CATALOG_THEME.surface);
    setVisualFinish(DEFAULT_CATALOG_THEME.finish);
    setVisualBackground(DEFAULT_CATALOG_THEME.background);
    setVisualDepth(DEFAULT_CATALOG_THEME.depth);
    setExplorerScale(DEFAULT_CATALOG_THEME.explorerScale);
    setExplorerMotion(DEFAULT_CATALOG_THEME.explorerMotion);
    setVisualTypography(DEFAULT_CATALOG_THEME.typography);
    setVisualBackgroundImage("");
    setDocumentUrl("");
    setDocumentLabel(`${isTrip ? "Trip" : "Event"} information PDF`);
    setPublished(false);
    setFeatured(false);
  }

  return (
    <form
      className="pi-admin-form pi-admin-form--catalog"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await createCatalogItem({
            id: item?.id,
            kind,
            title,
            slug,
            shortDescription,
            description,
            destinationOrCategory,
            durationOrVenue,
            meetingPoint,
            date: date || undefined,
            endDate: endDate || undefined,
            departurePoint,
            returnPoint,
            packageLabel,
            accommodation,
            transportation,
            importantInformation: lines(importantInformation),
            price: price ? Number(price) : undefined,
            capacity: capacity ? Number(capacity) : undefined,
            bookingMode,
            applicationRequired,
            seatSelectionEnabled: isTrip && seatSelectionEnabled,
            songRequestEnabled: isTrip && songRequestEnabled,
            seatConfig: editorSeatConfigWithFleet(item?.seat_config, vehicleCount),
            bookingFormFields,
            requestFormFields,
            requestFormTheme: { style: requestFormStyle },
            paymentProofRequired: isTrip && paymentProofRequired,
            inclusions: lines(inclusions),
            exclusions: lines(exclusions),
            media: {
              hero: hero || undefined,
              heroAlt: heroAlt || undefined,
              gallery,
              video: video || undefined,
              linkedTripSlug: !isTrip && linkedTripSlug ? linkedTripSlug : undefined,
              visualTheme: {
                logo: visualLogo || undefined,
                logoAlt: visualLogoAlt || undefined,
                primaryColor: visualPrimary,
                secondaryColor: visualSecondary,
                surface: visualSurface,
                finish: visualFinish,
                background: visualBackground,
                depth: visualDepth,
                explorerScale,
                explorerMotion,
                typography: visualTypography,
                channels: catalogChannels,
                backgroundImage: visualBackgroundImage || undefined,
              },
            },
            documentUrl,
            documentLabel,
            published,
            featured,
          });

          if (!result.ok) {
            setMessage({ tone: "error", text: result.error });
            return;
          }

          if (!item) resetNewItem();
          setMessage({
            tone: "success",
            text: `${label[0].toUpperCase()}${label.slice(1)} ${item ? "updated" : "created"}.`,
          });
        });
      }}
    >
      <fieldset className="pi-admin-form__section">
        <legend>Core details</legend>
        <label>
          Title
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slug) {
                setSlug(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
                );
              }
            }}
          />
        </label>
        <label>
          Slug
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
          />
        </label>
        <label>
          Short description
          <input
            maxLength={320}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
          />
        </label>
        <label>
          Full description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="pi-admin-form__grid pi-admin-form__grid--two">
          <label>
            {isTrip ? "Destination" : "Category"}
            <input
              value={destinationOrCategory}
              onChange={(event) => setDestinationOrCategory(event.target.value)}
            />
          </label>
          <label>
            {isTrip ? "Duration" : "Venue"}
            <input
              value={durationOrVenue}
              onChange={(event) => setDurationOrVenue(event.target.value)}
            />
          </label>
        </div>
        {isTrip ? (
          <label>
            Meeting point
            <input
              value={meetingPoint}
              onChange={(event) => setMeetingPoint(event.target.value)}
            />
          </label>
        ) : null}
        {isTrip ? (
          <label className="pi-admin-check pi-admin-switch">
            <input type="checkbox" checked={songRequestEnabled} onChange={(event) => setSongRequestEnabled(event.target.checked)} />
            Let guests add one optional song to this trip&apos;s playlist
          </label>
        ) : null}
        <div className="pi-admin-form__grid">
          <label>
            {isTrip ? <>Departure <span className="opt">Optional</span></> : "Starts"}
            <input
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            {isTrip ? "Return" : "Ends"}
            <input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <label>
            Price (EGP)
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <label>
            Capacity
            <input
              type="number"
              min="1"
              step="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {!isTrip ? (
        <fieldset className="pi-admin-form__section">
          <legend>Shared trip experience</legend>
          <p className="pi-admin-help">
            Use this when one experience should appear in Events and Trips but keep one details and booking page.
          </p>
          <label>
            Linked trip slug
            <input
              placeholder="e.g. outer-banks-sinai"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={linkedTripSlug}
              onChange={(event) => setLinkedTripSlug(event.target.value)}
            />
          </label>
        </fieldset>
      ) : null}

      <fieldset className="pi-admin-form__section">
        <legend>Where this experience appears</legend>
        <p className="pi-admin-help">
          This stays one experience with one details page and one application. Choose every public catalogue where its card should appear.
        </p>
        <div className="pi-admin-form__grid pi-admin-form__grid--two">
          {([
            ["trips", "Trips"],
            ["events", "Events"],
            ["themes", "Themes"],
          ] as const).map(([channel, channelLabel]) => (
            <label className="pi-admin-check pi-admin-switch" key={channel}>
              <input
                type="checkbox"
                checked={catalogChannels.includes(channel)}
                onChange={(event) => setCatalogChannels((current) => event.target.checked
                  ? Array.from(new Set([...current, channel]))
                  : current.filter((value) => value !== channel))}
              />
              Show in {channelLabel}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="pi-admin-form__section">
        <legend>Guest flow</legend>
        <p className="pi-admin-help">
          Choose whether this experience is booked immediately, sent as a simple request, or reviewed as a full application that you accept or reject.
        </p>
        <label>
          Guest path
          <select
            value={bookingMode}
            onChange={(event) => {
              const value = event.target.value as "booking" | "request" | "application";
              setBookingMode(value);
              if (value === "application") setApplicationRequired(true);
            }}
          >
            <option value="booking">Direct booking</option>
            <option value="request">Simple trip / event request</option>
            <option value="application">Trip Application — accept or reject</option>
          </select>
        </label>
        <label className="pi-admin-check pi-admin-switch">
          <input
            type="checkbox"
            checked={applicationRequired}
            onChange={(event) => setApplicationRequired(event.target.checked)}
          />
          Require an application before this {label} can be booked
        </label>
        {isTrip ? (
          <label className="pi-admin-check pi-admin-switch">
            <input
              type="checkbox"
              checked={seatSelectionEnabled}
              onChange={(event) => setSeatSelectionEnabled(event.target.checked)}
            />
            Let guests choose a seat for this trip
          </label>
        ) : null}
        {isTrip && seatSelectionEnabled ? (
          <>
            <label>
              Number of Hiaces / vehicles
              <input
                type="number"
                min="1"
                max="8"
                step="1"
                value={vehicleCount}
                onChange={(event) => setVehicleCount(Number(event.target.value))}
              />
            </label>
            <p className="pi-admin-help">
              Seat 1 beside the driver is permanently reserved for your guide, so each Hiace sells 13 seats. Guests are sent automatically to the next Hiace with enough free seats; they only choose their seat numbers.
            </p>
          </>
        ) : null}
        {isTrip ? (
          <label className="pi-admin-check pi-admin-switch">
            <input
              type="checkbox"
              checked={paymentProofRequired}
              onChange={(event) => setPaymentProofRequired(event.target.checked)}
            />
            Require an InstaPay or Vodafone Cash receipt in this trip&apos;s booking form
          </label>
        ) : null}
      </fieldset>

      {isTrip ? (
        <fieldset className="pi-admin-form__section">
          <legend>Custom booking form</legend>
          <BookingFormBuilder
            fields={bookingFormFields}
            onChange={setBookingFormFields}
            uploading={uploading}
            onAccommodationImageUpload={uploadAccommodationOptionPhoto}
          />
        </fieldset>
      ) : null}

      {isTrip ? (
        <fieldset className="pi-admin-form__section">
          <legend>Trip Application</legend>
          <p className="pi-admin-help">
            These are the questions guests see only when this trip uses the application workflow. Full name, email and WhatsApp stay protected as the fixed contact basics. The form automatically uses the logo, colours, background and type selected in Visual identity below.
          </p>
          <label>
            Application layout
            <select value={requestFormStyle} onChange={(event) => setRequestFormStyle(event.target.value as NonNullable<RequestFormTheme["style"]>)}>
              <option value="immersive">Immersive — full visual identity</option>
              <option value="editorial">Editorial — story-led cards</option>
              <option value="minimal">Minimal — clean and focused</option>
            </select>
          </label>
          <BookingFormBuilder fields={requestFormFields} onChange={setRequestFormFields} />
        </fieldset>
      ) : null}

      <fieldset className="pi-admin-form__section">
        <legend>What guests receive</legend>
        {isTrip ? (
          <div className="pi-admin-form__grid pi-admin-form__grid--two">
            <label>Departure point<input value={departurePoint} onChange={(event) => setDeparturePoint(event.target.value)} /></label>
            <label>Return point<input value={returnPoint} onChange={(event) => setReturnPoint(event.target.value)} /></label>
            <label>Package label<input placeholder="e.g. Full trip package" value={packageLabel} onChange={(event) => setPackageLabel(event.target.value)} /></label>
            <label>Accommodation<input value={accommodation} onChange={(event) => setAccommodation(event.target.value)} /></label>
            <label>Transportation<input value={transportation} onChange={(event) => setTransportation(event.target.value)} /></label>
          </div>
        ) : null}
        <div className="pi-admin-form__grid pi-admin-form__grid--two">
          <label>
            Included — one item per line
            <textarea
              value={inclusions}
              onChange={(event) => setInclusions(event.target.value)}
            />
          </label>
          <label>
            Not included — one item per line
            <textarea
              value={exclusions}
              onChange={(event) => setExclusions(event.target.value)}
            />
          </label>
        </div>
        <label>
          Important information — one item per line
          <textarea value={importantInformation} onChange={(event) => setImportantInformation(event.target.value)} />
        </label>
      </fieldset>

      <fieldset className="pi-admin-form__section">
        <legend>Photos and video</legend>
        <p className="pi-admin-help">
          Upload directly from a phone or computer. Images: 10 MB max. Video: 50 MB on the current Supabase plan. For a larger video, paste its externally hosted URL below.
        </p>
        <label>
          Cover image URL
          <input
            type="text"
            inputMode="url"
            value={hero}
            onChange={(event) => setHero(event.target.value)}
          />
        </label>
        <div className="pi-admin-asset-actions">
          <UploadControl
            kind="image"
            label="Upload cover image"
            disabled={uploading}
            onFiles={(files) =>
              uploadFiles(files.slice(0, 1), "image", (url) => setHero(url))
            }
          />
          {hero ? (
            <button type="button" onClick={() => setHero("")}>
              Remove cover
            </button>
          ) : null}
        </div>
        <label>
          Cover image description (alt text)
          <input
            maxLength={240}
            value={heroAlt}
            onChange={(event) => setHeroAlt(event.target.value)}
          />
        </label>

        <label>
          Video URL
          <input
            type="text"
            inputMode="url"
            value={video}
            onChange={(event) => setVideo(event.target.value)}
          />
        </label>
        <div className="pi-admin-asset-actions">
          <UploadControl
            kind="video"
            label="Upload video"
            disabled={uploading}
            onFiles={(files) =>
              uploadFiles(files.slice(0, 1), "video", (url, file) => {
                setVideo(url);
                setGallery((current) => current.some((item) => item.src === url) ? current : [...current, { src: url, alt: file.name.replace(/\.[^.]+$/, ""), type: "video" }]);
              })
            }
          />
          {video ? <><button type="button" onClick={() => setVideo("")}>Remove video from hero</button><video className="pi-admin-video-preview" src={video} controls muted playsInline /></> : null}
        </div>
        <p className="pi-admin-hint">MP4, WebM or MOV up to 150 MB. Large videos upload in resumable chunks without changing their quality.</p>

        <div className="pi-admin-gallery-editor">
          <h3>Gallery</h3>
          <UploadControl
            kind="image"
            label="Upload gallery photos"
            multiple
            disabled={uploading}
            onFiles={(files) =>
              uploadFiles(files.slice(0, 12), "image", (url, file) =>
                setGallery((current) => [
                  ...current,
                  { src: url, alt: file.name.replace(/\.[^.]+$/, ""), type: "image" },
                ]),
              )
            }
          />
          <UploadControl
            kind="video"
            label="Upload gallery videos"
            multiple
            disabled={uploading}
            onFiles={(files) => uploadFiles(files.slice(0, 6), "video", (url, file) => setGallery((current) => [...current, { src: url, alt: file.name.replace(/\.[^.]+$/, ""), type: "video" }]))}
          />
          <div className="pi-admin-inline-field">
            <input
              type="text"
              inputMode="url"
              aria-label="Gallery image URL"
              placeholder="Or paste an image URL"
              value={galleryUrl}
              onChange={(event) => setGalleryUrl(event.target.value)}
            />
            <button
              type="button"
              disabled={!galleryUrl.trim()}
              onClick={() => {
                setGallery((current) => [
                  ...current,
                  { src: galleryUrl.trim(), alt: "" },
                ]);
                setGalleryUrl("");
              }}
            >
              Add
            </button>
          </div>
          {gallery.length ? (
            <div className="pi-admin-gallery-list">
              {gallery.map((image, index) => (
                <div key={`${image.src}-${index}`}>
                  {image.type === "video" ? <video className="pi-admin-gallery-preview" src={image.src} poster={image.poster} muted playsInline preload="metadata" /> : <img className="pi-admin-gallery-preview" src={image.src} alt="" />}
                  <a href={image.src} target="_blank" rel="noreferrer">{image.type === "video" ? "Video" : "Photo"} {index + 1}</a>
                  <input
                    aria-label={`Description for gallery photo ${index + 1}`}
                    placeholder="Image description"
                    value={image.alt}
                    onChange={(event) =>
                      setGallery((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, alt: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => image.type === "video" ? setVideo(image.src) : setHero(image.src)}
                  >
                    {image.type === "video" ? "Use as hero video" : "Use as cover"}
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => setGallery((current) => current.map((entry, entryIndex) => entryIndex === index - 1 ? current[index] : entryIndex === index ? current[index - 1] : entry))}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGallery((current) =>
                        current.filter((_, entryIndex) => entryIndex !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {uploadMessage ? (
          <p
            className={
              uploadMessage.tone === "success"
                ? "pi-admin-success"
                : "pi-admin-error"
            }
            aria-live="polite"
          >
            {uploadMessage.text}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="pi-admin-form__section">
        <legend>Visual identity</legend>
        <p className="pi-admin-help">
          Upload PNG, JPG or WebP. The editor extracts the mark, removes a simple solid background, converts it to a transparent PNG and suggests the palette, atmosphere and typography for the whole public page.
        </p>

        <div
          className="pi-admin-theme-preview"
          data-surface={visualSurface}
          data-finish={visualFinish}
          data-background={visualBackground}
          data-depth={visualDepth}
          data-typography={visualTypography}
          style={{
            "--preview-primary": visualPrimary,
            "--preview-secondary": visualSecondary,
            "--preview-image": visualBackgroundImage ? `url("${visualBackgroundImage.replace(/["\\]/g, "")}")` : "none",
          } as CSSProperties}
        >
          <div className="pi-admin-theme-preview__orb">
            {visualLogo ? (
              // Dynamic admin uploads can come from any configured public storage host.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visualLogo} alt={visualLogoAlt || "Visual identity preview"} />
            ) : <span aria-hidden="true">∞</span>}
          </div>
          <div><small>{isTrip ? "TRIP WORLD" : "EVENT WORLD"}</small><strong>{title || `New ${label}`}</strong></div>
        </div>

        <div className="pi-admin-form__grid pi-admin-form__grid--two">
          <label>
            Logo image URL
            <input type="text" inputMode="url" value={visualLogo} onChange={(event) => setVisualLogo(event.target.value)} />
          </label>
          <label>
            Logo description
            <input maxLength={240} value={visualLogoAlt} onChange={(event) => setVisualLogoAlt(event.target.value)} />
          </label>
        </div>
        <div className="pi-admin-asset-actions">
          <UploadControl
            kind="image"
            label="Upload logo — PNG, JPG or WebP"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            disabled={uploading}
            onFiles={async (files) => {
              const file = files[0];
              if (!file) return;
              setThemeSuggestionMessage(null);
              try {
                const prepared = await prepareLogoUpload(file);
                const suggestion = await analyseLogo(prepared.file);
                setVisualPrimary(suggestion.primary);
                setVisualSecondary(suggestion.secondary);
                setVisualSurface(suggestion.surface);
                setVisualBackground(suggestion.background);
                setVisualTypography(suggestion.typography);
                setVisualFinish("soft-metal");
                setThemeSuggestionMessage({ tone: "success", text: prepared.extracted ? "Background removed. A transparent logo, palette, page mood and type style were prepared automatically." : "Transparent logo detected. Palette, page mood and type style were suggested automatically." });
                await uploadFiles([prepared.file], "image", (url) => setVisualLogo(url));
              } catch (error) {
                setThemeSuggestionMessage({ tone: "error", text: error instanceof Error ? error.message : "The logo could not be prepared." });
              }
            }}
          />
          {visualLogo ? <button type="button" onClick={() => setVisualLogo("")}>Remove logo</button> : null}
        </div>
        {themeSuggestionMessage ? <p className={themeSuggestionMessage.tone === "success" ? "pi-admin-success" : "pi-admin-error"} aria-live="polite">{themeSuggestionMessage.text}</p> : null}

        <div className="pi-admin-form__grid pi-admin-form__grid--two pi-admin-theme-colors">
          <label>
            Primary colour
            <span><input type="color" value={visualPrimary} onChange={(event) => setVisualPrimary(event.target.value)} /><input value={visualPrimary} pattern="#[0-9A-Fa-f]{6}" onChange={(event) => setVisualPrimary(event.target.value)} /></span>
          </label>
          <label>
            Secondary colour
            <span><input type="color" value={visualSecondary} onChange={(event) => setVisualSecondary(event.target.value)} /><input value={visualSecondary} pattern="#[0-9A-Fa-f]{6}" onChange={(event) => setVisualSecondary(event.target.value)} /></span>
          </label>
          <label>
            Page mood
            <select value={visualSurface} onChange={(event) => setVisualSurface(event.target.value as CatalogSurface)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            Page type style
            <select value={visualTypography} onChange={(event) => setVisualTypography(event.target.value as CatalogTypography)}>
              <option value="brand">Planet Infinity brand</option>
              <option value="editorial">Editorial / destination</option>
              <option value="rounded">Rounded / playful</option>
              <option value="technical">Technical / nightlife</option>
            </select>
          </label>
          <label>
            Logo finish
            <select value={visualFinish} onChange={(event) => setVisualFinish(event.target.value as CatalogFinish)}>
              <option value="matte">Matte / non-metallic</option>
              <option value="soft-metal">Soft metallic</option>
              <option value="metallic">High metallic</option>
            </select>
          </label>
          <label>
            Background atmosphere
            <select value={visualBackground} onChange={(event) => setVisualBackground(event.target.value as CatalogBackground)}>
              <option value="clean">Clean gradient</option>
              <option value="stars">Stars</option>
              <option value="desert">Desert glow</option>
              <option value="sea-blur">Blurred sea</option>
              <option value="night">Deep night</option>
            </select>
          </label>
          <label>
            UI depth
            <select value={visualDepth} onChange={(event) => setVisualDepth(event.target.value as CatalogDepth)}>
              <option value="flat">Flat</option>
              <option value="raised">Raised cards</option>
              <option value="three-d">3D cards and price</option>
            </select>
          </label>
          <label>
            Explorer motion
            <select value={explorerMotion} onChange={(event) => setExplorerMotion(event.target.value as CatalogExplorerMotion)}>
              <option value="still">Still</option>
              <option value="gentle">Gentle float</option>
              <option value="interactive">Interactive tilt</option>
            </select>
          </label>
          <label>
            Explorer object size ({Math.round(explorerScale * 100)}%)
            <input type="range" min="0.75" max="1.3" step="0.05" value={explorerScale} onChange={(event) => setExplorerScale(Number(event.target.value))} />
          </label>
        </div>

        <label>
          Optional background image URL
          <input type="text" inputMode="url" value={visualBackgroundImage} onChange={(event) => setVisualBackgroundImage(event.target.value)} />
        </label>
        <div className="pi-admin-asset-actions">
          <UploadControl kind="image" label="Upload background image" disabled={uploading} onFiles={(files) => uploadFiles(files.slice(0, 1), "image", (url) => setVisualBackgroundImage(url))} />
          {visualBackgroundImage ? <button type="button" onClick={() => setVisualBackgroundImage("")}>Remove background</button> : null}
        </div>
      </fieldset>

      <fieldset className="pi-admin-form__section">
        <legend>PDF document</legend>
        <p className="pi-admin-help">
          Guests see a clean document card; the raw storage or Drive link stays hidden.
        </p>
        <label>
          Document label
          <input
            maxLength={120}
            value={documentLabel}
            onChange={(event) => setDocumentLabel(event.target.value)}
          />
        </label>
        <label>
          PDF URL
          <input
            type="text"
            inputMode="url"
            value={documentUrl}
            onChange={(event) => setDocumentUrl(event.target.value)}
          />
        </label>
        <div className="pi-admin-asset-actions">
          <UploadControl
            kind="document"
            label="Upload PDF"
            disabled={uploading}
            onFiles={(files) =>
              uploadFiles(files.slice(0, 1), "document", (url) =>
                setDocumentUrl(url),
              )
            }
          />
          {documentUrl ? (
            <button type="button" onClick={() => setDocumentUrl("")}>
              Remove PDF
            </button>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="pi-admin-form__section">
        <legend>Visibility</legend>
        <label className="pi-admin-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
          Publish to the public website
        </label>
        <label className="pi-admin-check">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Mark as featured
        </label>
      </fieldset>

      {message ? (
        <p
          className={
            message.tone === "success" ? "pi-admin-success" : "pi-admin-error"
          }
          aria-live="polite"
        >
          {message.text}
        </p>
      ) : null}
      <button
        className="pi-admin-button pi-admin-button--save"
        type="submit"
        disabled={pending || uploading}
      >
        {pending ? "Saving…" : item ? `Save ${label}` : `Add ${label}`}
      </button>
    </form>
  );
}
