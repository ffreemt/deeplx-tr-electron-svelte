<svelte:head>
  <!-- moved to main.js -->
	<!-- <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script> -->
	<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@29.0.0/styles/ag-grid.css" /> -->
	<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@29.0.0/styles/ag-theme-alpine.css" /> -->
</svelte:head>

<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'

  import {onMount} from 'svelte'
  // const { Grid } = require("ag-grid-community")
  import { Grid } from 'ag-grid-community'

  console.log("to turn log off: console.log = () => {}")
  // console.log = () => {}
  console.log(' console.log... ')

  let rowData = [ { text1: "test1...", text2: "test2..."} ]
  rowData = [ ]
  const rowData1 = [
		{ make: "Toyota", model: "Celica", price: 35000 },
		{ make: "Ford", model: "Mondeo", price: 32000 },
		{ make: "Porsche", model: "Boxter", price: 72000 }
	]
  let gridContainer
  const headers = ['text1', 'text2', 'metric']
// const columnDefs = headers.map(el => { return { headerName: el, field: el } })
const columnDefs = [
  {
    headerName: 'text1',
    field: "text1",
    editable: true,
    flex: 1,
    resizable: true,
    autoHeight: true,
    wrapText: true,
    cellEditor: 'agLargeTextCellEditor',
    // cellEditorPopup: true,
    onCellValueChanged: () => {
        let rowData = []
        gridOptions.api.forEachNode(node => rowData.push(node.data))
        // ipcRenderer.invoke("update-rowdata", rowData) // TODO fix preload
    },  // await ipcRenderer.invoke("update-rowdata", rowData)
  },
  {
    headerName: 'text2',
    field: "text2",
    editable: true,
    flex: 1,
    resizable: true,
    autoHeight: true,
    wrapText: true,
    cellEditor: 'agLargeTextCellEditor',
    onCellValueChanged: () => {
        let rowData = []
        gridOptions.api.forEachNode(node => rowData.push(node.data))
        // ipcRenderer.invoke("update-rowdata", rowData)  // TODO fix preload 
    },
  },
  // {
    // headerName: 'metric',
    // field: "metric",
    // editable: true,
    // width: 85
  // },
]

const columnDefs1 = [
		{ field: "make" },
		{ field: "model" },
		{ field: "price" }
	]

const gridOptions = {
  columnDefs,
  rowData,
};  

// const gridDiv = document.getElementById("grid");
// new Grid(gridDiv, gridOptions);
onMount(() => {
  // new agGrid.Grid(gridContainer, gridOptions);
  new Grid(gridContainer, gridOptions);
})

const ipc = window.api.ipcRenderer
const api = window.api
api.rowData('rowData', (rowData) => {
  // console.log(' channel rowData received: ', JSON.stringify(rowData))
  gridOptions.api.setRowData(rowData)
})

</script>

<main>
  <!-- <div id="datagrid" class="ag-theme-alpine" style="height: 600px; width:600px;" bind:this={gridContainer}></div> -->
  <div id="datagrid" class="ag-theme-alpine" style="height: 600px; width: 100%;" bind:this={gridContainer}></div>
      
  <div>
    <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <!-- <h1>Vite + Svelte</h1> -->

  <div class="card">
    <Counter />
  </div>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer">SvelteKit</a>, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more
  </p>
</main>

<style>
	#datagrid {
    flex: 1;
    width: 100%;
		--ag-header-foreground-color: blue;
	}	
	:global(.ag-header-cell) {
		background: greenyellow;
		/* font-size: 14px; */
	}

  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
