import fs from "node:fs"

const required = [
  "src/App.tsx",
  "src/main.tsx",
  "src/core/config.ts",
  "src/core/storage.ts",
  "src/framer/canvas-component-service.ts",
]

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
}

const canvasService = fs.readFileSync("src/framer/canvas-component-service.ts", "utf8")
for (const token of ["ChatBubbles", "addPropertyControls", "syncCanvasInstance", "insertCanvasComponent"]) {
  if (!canvasService.includes(token)) throw new Error(`Canvas service missing ${token}`)
}

console.log("Smoke check passed.")
