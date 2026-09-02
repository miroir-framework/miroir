/**
 * Primary discriminator of a Jzod union — the field that actually selects the
 * branch (e.g. `transformerType`). Secondary names listed on the same
 * discriminator array (`interpolation`) do not identify a branch by themselves.
 */
export function primaryUnionDiscriminatorField(
  discriminator: string | (string | string[])[] | undefined,
): string | undefined {
  if (discriminator == null) {
    return undefined;
  }
  if (typeof discriminator === "string") {
    return discriminator;
  }
  const first = discriminator[0];
  if (typeof first === "string") {
    return first;
  }
  if (Array.isArray(first) && typeof first[0] === "string") {
    return first[0];
  }
  return undefined;
}

export function isPrimaryUnionDiscriminatorField(
  fieldName: string,
  discriminator: string | (string | string[])[] | undefined,
): boolean {
  const primary = primaryUnionDiscriminatorField(discriminator);
  return primary !== undefined && fieldName === primary;
}
