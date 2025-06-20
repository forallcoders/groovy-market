export function slugify(text: string) {
  return text
    .toString() // Convert to string in case we get a non-string
    .toLowerCase() // Convert to lowercase
    .normalize("NFD") // Normalize diacritics/accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]+/g, "") // Remove all non-word chars (except hyphens)
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, "") // Trim hyphens from end
}

export function shortname(name: string) {
  return name.substring(0, 3)
}
