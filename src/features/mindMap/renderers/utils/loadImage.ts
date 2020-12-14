export default function loadImage(url: string) {
  const image = new window.Image();
  return new Promise<HTMLImageElement>((resolve) => {
    image.onload = () => resolve(image);
    image.src = url;
  });
}
