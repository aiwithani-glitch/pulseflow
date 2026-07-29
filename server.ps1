# High-performance TcpListener Static Web Server (No Admin Rights Required)
$port = 8080
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "PulseFlow AI Server LIVE at http://192.168.1.8:$port/ and http://localhost:$port/"

$root = $PSScriptRoot

while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrEmpty($requestLine)) {
        $client.Close()
        continue
    }

    $tokens = $requestLine.Split(' ')
    $urlPath = $tokens[1]
    if ($urlPath -eq '/') { $urlPath = '/index.html' }
    $urlPath = $urlPath.Split('?')[0] # Strip query params

    $filePath = Join-Path $root $urlPath.TrimStart('/')

    # Read remaining headers
    while ($true) {
        $header = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($header)) { break }
    }

    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        $mime = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css" }
            ".js"   { "application/javascript" }
            ".json" { "application/json" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".svg"  { "image/svg+xml" }
            default { "application/octet-stream" }
        }

        $headerStr = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerStr)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($bytes, 0, $bytes.Length)
    } else {
        $notFound = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nConnection: close`r`n`r`n404 Not Found"
        $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
        $stream.Write($notFoundBytes, 0, $notFoundBytes.Length)
    }
    
    $stream.Flush()
    $client.Close()
}
