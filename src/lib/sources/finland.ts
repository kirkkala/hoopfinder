/** Coarse Finland outline plus island/border boxes. Tiled Overpass bboxes leak into SE/NO/RU. */
const RINGS: Array<Array<[number, number]>> = [
  [
    [28.76496, 69.28491],
    [28.63569, 68.57052],
    [30.22365, 67.83161],
    [29.30842, 67.06249],
    [30.49642, 65.83223],
    [29.82269, 64.91748],
    [30.71648, 64.13717],
    [30.29393, 63.44417],
    [31.77316, 62.75672],
    [31.3848, 62.22179],
    [30.43004, 61.60548],
    [28.19257, 60.25177],
    [26.28659, 60.14573],
    [24.43509, 59.78416],
    [22.74235, 59.59701],
    [22.13291, 60.16066],
    [21.13063, 60.516],
    [21.33522, 61.51972],
    [20.8189, 62.46368],
    [21.28828, 63.05927],
    [22.19035, 63.69659],
    [24.47958, 64.77812],
    [25.19025, 64.92378],
    [25.03266, 65.63474],
    [23.63908, 66.09936],
    [23.31316, 66.5166],
    [23.35893, 68.15003],
    [21.76737, 68.80072],
    [20.42029, 69.27249],
    [21.03646, 69.55736],
    [22.16184, 69.04326],
    [23.52172, 69.13354],
    [24.6568, 68.91822],
    [25.68873, 69.37211],
    [26.20993, 70.10365],
    [27.84197, 70.42182],
    [29.18455, 69.98975],
    [28.76496, 69.28491],
  ],
  box(19.15, 59.75, 21.45, 60.7),
  box(21.05, 59.95, 22.55, 60.55),
  box(23.7, 65.35, 25.7, 66.15),
];

export function isInFinland(lat: number, lon: number): boolean {
  if (lon > 28.35 && lat < 60.92) return false;
  return RINGS.some((ring) => pointInRing(lon, lat, ring));
}

function box(
  west: number,
  south: number,
  east: number,
  north: number,
): Array<[number, number]> {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
}

function pointInRing(lon: number, lat: number, ring: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }
  return inside;
}
