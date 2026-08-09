# Extrae 3 frames (inicio, medio, final) de cada GIF y los pega en una tira
# horizontal, para poder juzgar el MOVIMIENTO y no la pose inicial.
#
# Por qué: el primer frame de un GIF suele ser la posición de partida, que en
# muchos ejercicios distintos se ve igual (de pie con mancuernas). Juzgar por
# el primer frame hace acusar mal a GIFs correctos y dejar pasar los malos.
#
# Uso: powershell -File dev/frames-gif.ps1 -Lista lista.json -Out carpeta
param(
  [Parameter(Mandatory = $true)][string]$Lista,
  [Parameter(Mandatory = $true)][string]$Out
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$items = Get-Content $Lista -Raw -Encoding UTF8 | ConvertFrom-Json
$ALTO = 190

foreach ($it in $items) {
  $nombre = $it.nombre
  $ruta = $it.archivo
  if (-not (Test-Path $ruta)) { Write-Output "FALTA: $ruta"; continue }

  $img = [System.Drawing.Image]::FromFile($ruta)
  $dim = New-Object System.Drawing.Imaging.FrameDimension($img.FrameDimensionsList[0])
  $n = $img.GetFrameCount($dim)
  # Inicio, medio y final: con eso alcanza para reconocer el patrón.
  $idx = @(0, [int]($n / 2), [int]($n - 1)) | Select-Object -Unique

  $ancho = $img.Width * $idx.Count + 8 * ($idx.Count - 1)
  $tira = New-Object System.Drawing.Bitmap($ancho, $img.Height)
  $g = [System.Drawing.Graphics]::FromImage($tira)
  $g.Clear([System.Drawing.Color]::White)
  for ($i = 0; $i -lt $idx.Count; $i++) {
    $img.SelectActiveFrame($dim, $idx[$i]) | Out-Null
    $g.DrawImage($img, ($img.Width + 8) * $i, 0, $img.Width, $img.Height)
  }
  $g.Dispose()

  $slug = ($nombre -replace '[^a-zA-Z0-9]+', '-').Trim('-').ToLower()
  $tira.Save((Join-Path $Out "$slug.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $tira.Dispose(); $img.Dispose()
  Write-Output "$slug.png  ($n frames)"
}
