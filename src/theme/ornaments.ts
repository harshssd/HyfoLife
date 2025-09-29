export type TileGlyph = "bat" | "bolt" | "claw" | "web" | "shield" | "star";

export function glyphFor(name?: string): TileGlyph | null {
  switch (name) {
    case "bat":
    case "bolt":
    case "claw":
    case "web":
    case "shield":
    case "star":
      return name;
    default:
      return null;
  }
}


