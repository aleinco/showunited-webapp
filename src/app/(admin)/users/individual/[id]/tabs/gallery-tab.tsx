'use client';

import { Title, Text } from 'rizzui';

export default function GalleryTab({ user }: { user: any }) {
  const images = user.IndividualUserImageList || [];

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Text className="text-gray-400">No photos uploaded by this user.</Text>
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="mb-4">
        <Title as="h5" className="text-base font-semibold">
          User Gallery
        </Title>
        <Text className="mt-1 text-sm text-gray-500">
          {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-4 @lg:grid-cols-3 @3xl:grid-cols-4">
        {images.map((img: any) => (
          <div
            key={img.IndividualUserImageId}
            className="group relative overflow-hidden rounded-lg border border-muted bg-white"
          >
            <img
              src={img.IndividualUserImage}
              alt={`Photo ${img.IndividualUserImageId}`}
              className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            {img.DTStamp && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Text className="text-xs text-white">
                  {new Date(img.DTStamp).toLocaleDateString()}
                </Text>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
