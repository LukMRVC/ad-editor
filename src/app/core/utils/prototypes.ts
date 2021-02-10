export { }; // make this file a module

declare global {
  interface String {
    slugify(): string;
  }
}

String.prototype.slugify = function(separator = ''): string {
  return this
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, separator);
};
