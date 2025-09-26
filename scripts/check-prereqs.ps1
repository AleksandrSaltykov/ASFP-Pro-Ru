param()

function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [scriptblock]$Version = { $null }
    )

    try {
        $null = & $Check
        $info = $null
        if ($Version) {
            $info = & $Version
        }
        if ($info) {
            Write-Host "[OK] $Name ($info)"
        } else {
            Write-Host "[OK] $Name"
        }
        return $true
    }
    catch {
        Write-Host "[MISS] $Name" -ForegroundColor Yellow
        return $false
    }
}

$checks = @(
    @{ Name = 'Git'; Check = { Get-Command git -ErrorAction Stop }; Version = { git --version } },
    @{ Name = 'Node.js'; Check = { Get-Command node -ErrorAction Stop }; Version = { node --version } },
    @{ Name = 'corepack'; Check = { Get-Command corepack -ErrorAction Stop }; Version = { corepack --version } },
    @{ Name = 'pnpm'; Check = { Get-Command pnpm -ErrorAction Stop }; Version = { pnpm --version } },
    @{ Name = 'Go'; Check = { Get-Command go -ErrorAction Stop }; Version = { go version } },
    @{ Name = 'Docker'; Check = { Get-Command docker -ErrorAction Stop }; Version = { docker --version } },
    @{ Name = 'mkcert'; Check = { Get-Command mkcert -ErrorAction Stop }; Version = { mkcert -version } },
    @{ Name = 'make'; Check = { Get-Command make -ErrorAction Stop }; Version = { (make --version | Select-Object -First 1) } },
    @{ Name = 'WSL'; Check = { Get-Command wsl -ErrorAction Stop } }
)

$missing = 0
foreach ($item in $checks) {
    $ok = Test-Requirement -Name $item.Name -Check $item.Check -Version $item.Version
    if (-not $ok) {
        $missing += 1
    }
}

if ($missing -gt 0) {
    Write-Host "`nSome requirements are missing. Install the components marked with [MISS] and rerun the script." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nAll prerequisites detected. You are ready to work on ASFP-Pro." -ForegroundColor Green
    exit 0
}
