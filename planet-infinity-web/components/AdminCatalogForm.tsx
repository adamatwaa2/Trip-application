"use client";

import { useState, useTransition } from "react";
import {
  createCatalogItem,
  createCatalogUploadTarget,
} from "@/app/actions/admin";
import { HIACE_14, type SeatConfig } from "@/content/trips";
import {
  CATALOG_MEDIA_ACCEPT,
  type CatalogMediaKind,
  validateCatalogMedia,
} from "@/lib/catalog-media";
import { createClient } from "@/lib/supabase/client";
import { BookingFormBuilder } from "@/components/BookingFormBuilder";
import type { BookingFormField } from "@/lib/booking-form";

type CatalogMedia = {
  hero?: string;
  heroAlt?: string;
  gallery?: { src: string; alt: string }[];
  video?: string;
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
  payment_proof_required?: boolean;
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

function editorSeatConfig(value: SeatConfig | null | undefined): SeatConfig {
  if (value?.layout && Array.isArray(value.layout.rows) && value.layout.rows.length) {
    return value;
  }
  return { layout: HIACE_14 };
}

function UploadControl({
  kind,
  label,
  multiple = false,
  disabled,
  onFiles,
}: {
  kind: CatalogMediaKind;
  label: string;
  multiple?: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => Promise<void>;
}) {
  return (
    <label className="pi-admin-upload">
      <span>{disabled ? "Uploading…" : label}</span>
      <input
        type="file"
        accept={CATALOG_MEDIA_ACCEPT[kind]}
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
  >(isTrip ? "booking" : item?.booking_mode ?? "booking");
  const [applicationRequired, setApplicationRequired] = useState(
    item?.application_required ?? false,
  );
  const [seatSelectionEnabled, setSeatSelectionEnabled] = useState(
    item?.seat_selection_enabled ?? false,
  );
  const [bookingFormFields, setBookingFormFields] = useState<BookingFormField[]>(
    item?.booking_form_fields ?? [],
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
  const [gallery, setGallery] = useState(initialMedia.gallery ?? []);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState(item?.document_url ?? "");
  const [documentLabel, setDocumentLabel] = useState(
    item?.document_label ?? `${isTrip ? "Trip" : "Event"} information PDF`,
  );
  const [published, setPublished] = useState(item?.is_published ?? false);
  const [featured, setFeatured] = useState(item?.is_featured ?? false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<FormMessage>(null);
  const [message, setMessage] = useState<FormMessage>(null);
  const [pending, startTransition] = useTransition();

  async function uploadOne(file: File, mediaKind: CatalogMediaKind) {
    const validationError = validateCatalogMedia(mediaKind, file.type, file.size);
    if (validationError) throw new Error(validationError);

    const target = await createCatalogUploadTarget({
      kind: mediaKind,
      mimeType: file.type,
      size: file.size,
    });
    if (!target.ok) throw new Error(target.error);

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(target.bucket)
      .uploadToSignedUrl(target.path, target.token, file, {
        cacheControl: "31536000",
        contentType: file.type,
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
    setBookingFormFields([]);
    setPaymentProofRequired(true);
    setInclusions("");
    setExclusions("");
    setHero("");
    setHeroAlt("");
    setVideo("");
    setGallery([]);
    setGalleryUrl("");
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
            seatConfig: editorSeatConfig(item?.seat_config),
            bookingFormFields,
            paymentProofRequired: isTrip && paymentProofRequired,
            inclusions: lines(inclusions),
            exclusions: lines(exclusions),
            media: {
              hero: hero || undefined,
              heroAlt: heroAlt || undefined,
              gallery,
              video: video || undefined,
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
        <div className="pi-admin-form__grid">
          <label>
            {isTrip ? "Departure" : "Starts"}
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

      <fieldset className="pi-admin-form__section">
        <legend>Guest flow</legend>
        {isTrip ? (
          <p className="pi-admin-help">
            Normal trips use direct booking. Turn on the application switch only for the rare trips that need approval first.
          </p>
        ) : (
          <label>
            Booking mode
            <select
              value={bookingMode}
              onChange={(event) => setBookingMode(event.target.value as "booking" | "request" | "application")}
            >
              <option value="booking">Direct booking</option>
              <option value="request">Request before booking</option>
              <option value="application">Application workflow</option>
            </select>
          </label>
        )}
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
          <p className="pi-admin-help">
            Uses the Toyota Hiace 14-seat layout. Existing availability is preserved
            when this trip is edited.
          </p>
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
          <BookingFormBuilder fields={bookingFormFields} onChange={setBookingFormFields} />
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
          Upload directly from a phone or computer. Images: 10 MB max. Video: 45 MB max.
        </p>
        <label>
          Cover image URL
          <input
            type="url"
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
            type="url"
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
              uploadFiles(files.slice(0, 1), "video", (url) => setVideo(url))
            }
          />
          {video ? (
            <button type="button" onClick={() => setVideo("")}>
              Remove video
            </button>
          ) : null}
        </div>

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
                  { src: url, alt: file.name.replace(/\.[^.]+$/, "") },
                ]),
              )
            }
          />
          <div className="pi-admin-inline-field">
            <input
              type="url"
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
                  <a href={image.src} target="_blank" rel="noreferrer">
                    Photo {index + 1}
                  </a>
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
            type="url"
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
