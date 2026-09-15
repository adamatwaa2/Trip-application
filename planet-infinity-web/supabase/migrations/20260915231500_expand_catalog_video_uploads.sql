update storage.buckets
set file_size_limit = 157286400,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf'
    ]
where id = 'catalog-media';
