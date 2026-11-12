export function readLandscape(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      reject(new Error("Use a JPEG or PNG image."));
      return;
    }
    if (file.size > 1_500_000) {
      reject(new Error("Use an image under 1.5 MB."));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (image.width <= image.height) {
        reject(new Error("Use a landscape photo, wider than it is tall."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.readAsDataURL(file);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    image.src = url;
  });
}
