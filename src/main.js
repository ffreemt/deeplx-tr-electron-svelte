import './app.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app
