function getColumnDefinitions(attributes) {
    return attributes === null || attributes === void 0 ? void 0 : attributes.map((a) => { return { "headerName": a === null || a === void 0 ? void 0 : a.defaultLabel, "field": a === null || a === void 0 ? void 0 : a.name }; });
}

export { getColumnDefinitions };
