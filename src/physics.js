export const KILOMETERS_PER_SOLAR_MASS = 2.95;

export function schwarzschildRadiusKm(massInSolarMasses) {
  if (!Number.isFinite(massInSolarMasses) || massInSolarMasses < 0) {
    throw new RangeError('Mass must be a finite, non-negative number of solar masses.');
  }
  return massInSolarMasses * KILOMETERS_PER_SOLAR_MASS;
}

export function projectedRadiusUv(worldRadius, cameraDistance, verticalFovRadians) {
  if (!Number.isFinite(worldRadius) || worldRadius < 0) {
    throw new RangeError('World radius must be finite and non-negative.');
  }
  if (!Number.isFinite(cameraDistance) || cameraDistance <= 0) {
    throw new RangeError('Camera distance must be finite and positive.');
  }
  if (!Number.isFinite(verticalFovRadians) || verticalFovRadians <= 0 || verticalFovRadians >= Math.PI) {
    throw new RangeError('Vertical field of view must be between zero and pi radians.');
  }
  return worldRadius / (2 * cameraDistance * Math.tan(verticalFovRadians / 2));
}

// Source distances are not modeled in this screen-space educational approximation.
export function apparentEinsteinRadiusUv(horizonRadiusUv, scale = 1.55) {
  if (!Number.isFinite(horizonRadiusUv) || horizonRadiusUv < 0) {
    throw new RangeError('Horizon radius must be finite and non-negative.');
  }
  if (!Number.isFinite(scale) || scale < 0) {
    throw new RangeError('Einstein-radius scale must be finite and non-negative.');
  }
  return horizonRadiusUv * scale;
}
