$ErrorActionPreference = "Stop"

function Enable-DevTools {
    param (
        [string]$Path,
        [string]$Name
    )

    if (Test-Path $Path) {
        Write-Host "Found $Name settings at: $Path"
        
        try {
            $content = Get-Content $Path -Raw
            if ([string]::IsNullOrWhiteSpace($content)) {
                $json = @{}
            } else {
                $json = $content | ConvertFrom-Json
            }
            
            if (-not ($json.PSObject.Properties.Match("DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING").Count)) {
                $json | Add-Member -Type NoteProperty -Name "DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING" -Value $true
            } else {
                $json.DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING = $true
            }

            $json | ConvertTo-Json -Depth 10 | Set-Content $Path
            Write-Host "✅ DevTools enabled for $Name" -ForegroundColor Green
        } catch {
            Write-Host "Failed to modify $Name settings: $_" -ForegroundColor Red
        }
    }
}

$paths = @(
    @{ Name = "Discord Stable"; Path = "$env:APPDATA\discord\settings.json" },
    @{ Name = "Discord Canary"; Path = "$env:APPDATA\discordcanary\settings.json" },
    @{ Name = "Discord PTB";    Path = "$env:APPDATA\discordptb\settings.json" }
)

Write-Host "Checking Discord installations..."
$found = $false

foreach ($item in $paths) {
    if (Test-Path $item.Path) {
        $found = $true
        Enable-DevTools -Path $item.Path -Name $item.Name
    }
}

if (-not $found) {
    Write-Host "❌ No Discord installations found." -ForegroundColor Red
} else {
    Write-Host "`nSuccess! Please fully restart Discord (Quit from tray or Ctrl+R) to access DevTools (Ctrl+Shift+I)." -ForegroundColor Cyan
}
