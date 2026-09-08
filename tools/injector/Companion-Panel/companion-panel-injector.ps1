Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$AppTitle = 'Companion Panel Injector'

function Show-Info([string]$message) {
    [System.Windows.Forms.MessageBox]::Show(
        $message,
        $AppTitle,
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
}

function Show-Error([string]$message) {
    [System.Windows.Forms.MessageBox]::Show(
        $message,
        $AppTitle,
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
}

function Find-FirstHtmlInDirectory([string]$directoryPath) {
    if (-not (Test-Path -LiteralPath $directoryPath -PathType Container)) {
        return $null
    }

    $match = Get-ChildItem -LiteralPath $directoryPath -File -Filter '*.html' -ErrorAction SilentlyContinue |
        Sort-Object Name |
        Select-Object -First 1

    if ($match) {
        return $match.FullName
    }

    return $null
}

function Find-DefaultHtmlPath([string]$toolDir) {
    $searchDirs = @(
        $toolDir,
        (Split-Path $toolDir -Parent)
    ) | Select-Object -Unique

    foreach ($directoryPath in $searchDirs) {
        $match = Find-FirstHtmlInDirectory $directoryPath
        if ($match) {
            return $match
        }
    }

    return $null
}

function Pick-HtmlFile([string]$initialDirectory = $null) {
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Pick your game HTML file'
    $dialog.Filter = 'HTML files (*.html)|*.html|All files (*.*)|*.*'
    $dialog.Multiselect = $false
    $dialog.CheckFileExists = $true
    $dialog.CheckPathExists = $true
    $dialog.RestoreDirectory = $true

    if ($initialDirectory -and (Test-Path -LiteralPath $initialDirectory -PathType Container)) {
        $dialog.InitialDirectory = $initialDirectory
    }

    $result = $dialog.ShowDialog()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        return $null
    }

    return $dialog.FileName
}

function Confirm-HtmlPath([string]$htmlPath) {
    $answer = [System.Windows.Forms.MessageBox]::Show(
        "Use this HTML file?`n`n$htmlPath",
        'Confirm HTML Path',
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    return $answer -eq [System.Windows.Forms.DialogResult]::Yes
}

function Resolve-ActualHtmlPath([string]$htmlPath) {
    $trimmed = $htmlPath.Trim().Trim('"')

    if ([System.IO.File]::Exists($trimmed)) {
        return [System.IO.Path]::GetFullPath($trimmed)
    }

    if (-not [System.IO.Path]::IsPathRooted($trimmed)) {
        $cwdCandidate = Join-Path (Get-Location) $trimmed
        if ([System.IO.File]::Exists($cwdCandidate)) {
            return [System.IO.Path]::GetFullPath($cwdCandidate)
        }
    }

    return $null
}

function Assert-ReadableHtmlPath([string]$htmlPath) {
    $fullPath = Resolve-ActualHtmlPath $htmlPath
    if ($fullPath) {
        return $fullPath
    }

    $rawPath = $htmlPath.Trim().Trim('"')
    if ($rawPath -match '\\.zip\\' -or $rawPath -match '\\(Compressed\\)\\') {
        throw "The selected HTML is not a normal disk file:`n$rawPath`n`nIt appears to come from a compressed/virtual location. Please extract the game folder first, then pick the extracted HTML file."
    }

    throw "Selected HTML file was not found on disk:`n$rawPath`n`nPlease pick the actual extracted game HTML file and try again."
}

function Run-Node([string]$command, [string[]]$args, [hashtable]$envVars = @{}, [string]$workingDirectory = $null) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'node'
    $quotedArgs = @()
    foreach ($arg in $args) {
        $quotedArgs += '"' + $arg + '"'
    }
    $psi.Arguments = ('"' + $command + '" ' + ($quotedArgs -join ' '))
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    if ($workingDirectory) {
        $psi.WorkingDirectory = $workingDirectory
    }

    foreach ($key in $envVars.Keys) {
        $value = [string]$envVars[$key]
        if ($null -ne $value -and $value -ne '') {
            $psi.EnvironmentVariables[$key] = $value
        }
    }

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    [void]$proc.Start()

    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    return [PSCustomObject]@{
        ExitCode = $proc.ExitCode
        StdOut = $stdout
        StdErr = $stderr
    }
}

try {
    $toolDir = Split-Path -Parent $PSCommandPath
    Set-Location -LiteralPath $toolDir

    $injectScript = Join-Path $toolDir 'inject-local-html.cjs'
    $restoreScript = Join-Path $toolDir 'restore-local-html.cjs'
    $payloadPath = Join-Path $toolDir 'companion-panel.user.js'

    if (-not (Test-Path -LiteralPath $injectScript) -or -not (Test-Path -LiteralPath $restoreScript)) {
        throw 'Missing helper scripts. Keep companion-panel-injector.ps1 next to inject-local-html.cjs and restore-local-html.cjs.'
    }

    $action = [System.Windows.Forms.MessageBox]::Show(
        "Choose action:`n`nYes = Inject panel`nNo = Restore original HTML`nCancel = Exit",
        $AppTitle,
        [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($action -eq [System.Windows.Forms.DialogResult]::Cancel) {
        exit 0
    }

    $htmlPath = $null
    $defaultHtmlPath = Find-DefaultHtmlPath $toolDir

    if ($defaultHtmlPath -and (Confirm-HtmlPath $defaultHtmlPath)) {
        $htmlPath = Assert-ReadableHtmlPath $defaultHtmlPath
    }

    while (-not $htmlPath) {
        $pickerStart = Split-Path $toolDir -Parent
        $picked = Pick-HtmlFile $pickerStart
        if (-not $picked) {
            exit 0
        }

        if (-not (Confirm-HtmlPath $picked)) {
            continue
        }

        $htmlPath = Assert-ReadableHtmlPath $picked
    }

    $htmlDir = Split-Path -Parent $htmlPath
    $injectedScriptPath = Join-Path $htmlDir 'injected\companion-panel.user.js'

    if ($action -eq [System.Windows.Forms.DialogResult]::Yes) {
        if (-not (Test-Path -LiteralPath $payloadPath -PathType Leaf)) {
            throw 'Payload file not found. Keep companion-panel.user.js next to companion-panel-injector.ps1.'
        }

        $injectEnv = @{
            'DCPANEL_HTML' = $htmlPath
            'DCPANEL_SOURCE_SCRIPT' = $payloadPath
            'DCPANEL_INJECTED_SCRIPT' = $injectedScriptPath
        }

        $result = Run-Node $injectScript @(
            '--html', $htmlPath,
            '--source-script', $payloadPath,
            '--injected-script', $injectedScriptPath
        ) $injectEnv $toolDir

        if ($result.ExitCode -ne 0) {
            throw "Inject failed.`n`n$($result.StdErr)"
        }

        Show-Info("Injection complete.`n`n$($result.StdOut)")
    }
    else {
        $restoreEnv = @{
            'DCPANEL_HTML' = $htmlPath
            'DCPANEL_INJECTED_SCRIPT' = $injectedScriptPath
        }

        $result = Run-Node $restoreScript @(
            '--html', $htmlPath,
            '--injected-script', $injectedScriptPath
        ) $restoreEnv $toolDir

        if ($result.ExitCode -ne 0) {
            throw "Restore failed.`n`n$($result.StdErr)"
        }

        Show-Info("Restore complete.`n`n$($result.StdOut)")
    }
}
catch {
    Show-Error($_.Exception.Message)
    exit 1
}

