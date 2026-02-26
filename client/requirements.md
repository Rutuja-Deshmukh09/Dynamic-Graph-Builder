## Packages
react-plotly.js | Essential for high-performance scientific charting of simulation data
plotly.js-dist-min | Core Plotly library required by react-plotly.js
react-dropzone | Robust drag-and-drop file upload zone for PLT and TAB files
@types/react-plotly.js | TypeScript definitions for react-plotly.js
lucide-react | Icons

## Notes
- Ensure `plotly.js-dist-min` is properly resolved by Vite for React-Plotly.
- API assumes `/api/upload` accepts `multipart/form-data` with files appended to the `FormData` object.
- The UI defaults to a deep dark scientific engineering theme.
- All dynamic arrays mapping to Plotly traces require extraction of `x` and `y` arrays from the object lists.
