"use client";

type OrganicQrOptions = {
  targetSize?: number;
  dark?: string;
  light?: string;
};

export async function drawOrganicQr(
  canvas: HTMLCanvasElement,
  value: string,
  options: OrganicQrOptions = {},
) {
  const { default: QRCode } = await import("qrcode");
  const symbol = QRCode.create(value, { errorCorrectionLevel: "H" });
  const matrix = symbol.modules;
  const quietModules = 4;
  const requestedSize = options.targetSize ?? 480;
  const scale = Math.max(
    5,
    Math.floor(requestedSize / (matrix.size + quietModules * 2)),
  );
  const size = (matrix.size + quietModules * 2) * scale;
  const offset = quietModules * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");

  canvas.width = size;
  canvas.height = size;
  context.imageSmoothingEnabled = false;
  context.fillStyle = options.light ?? "#ffffff";
  context.fillRect(0, 0, size, size);
  context.fillStyle = options.dark ?? "#080808";

  const darkAt = (row: number, column: number) =>
    row >= 0 &&
    column >= 0 &&
    row < matrix.size &&
    column < matrix.size &&
    matrix.get(row, column) === 1;
  const organicAt = (row: number, column: number) =>
    darkAt(row, column) && !matrix.isReserved(row, column);

  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (!darkAt(row, column) || !matrix.isReserved(row, column)) continue;
      context.fillRect(
        offset + column * scale,
        offset + row * scale,
        scale,
        scale,
      );
    }
  }

  const connector = Math.max(2, Math.floor(scale * 0.52));
  const connectorOffset = Math.floor(connector / 2);
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (!organicAt(row, column)) continue;
      const centerX = offset + column * scale + scale / 2;
      const centerY = offset + row * scale + scale / 2;
      if (organicAt(row, column + 1))
        context.fillRect(
          Math.floor(centerX),
          Math.floor(centerY) - connectorOffset,
          scale,
          connector,
        );
      if (organicAt(row + 1, column))
        context.fillRect(
          Math.floor(centerX) - connectorOffset,
          Math.floor(centerY),
          connector,
          scale,
        );
    }
  }

  const radius = scale * 0.42;
  context.beginPath();
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (!organicAt(row, column)) continue;
      const centerX = offset + column * scale + scale / 2;
      const centerY = offset + row * scale + scale / 2;
      context.moveTo(centerX + radius, centerY);
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }
  }
  context.fill();

  return {
    errorCorrectionLevel: "H" as const,
    moduleStyle: "balls-and-chains" as const,
    size,
    version: symbol.version,
  };
}

export async function createOrganicQrDataUrl(value: string, targetSize = 480) {
  const canvas = document.createElement("canvas");
  await drawOrganicQr(canvas, value, { targetSize });
  return canvas.toDataURL("image/png");
}
