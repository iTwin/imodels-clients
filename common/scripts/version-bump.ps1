# PowerShell versions <7 reformat the whole package.json when writing back to file
#REQUIRES -Version 7

param (
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [ValidateSet("Clients", "Interop")]
    [string]$Packages,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [ValidateSet("Major", "Minor", "Patch")]
    [string]$Bump
)

function GetIntermediateDirName {
    if ($Packages -eq "Clients") { return "clients"; }
    if ($Packages -eq "Interop") { return "itwin-platform-access"; }
    throw "Invalid Packages parameter value."
}

function GetBumpIndex {
    if ($Bump -eq "Major") { return 0; }
    if ($Bump -eq "Minor") { return 1; }
    if ($Bump -eq "Patch") { return 2; }
    throw "Invalid Bump parameter value."
}

$repoRootDir = cmd.exe /c "git rev-parse --show-toplevel"
$packagesParentDir = Join-Path -Path $repoRootDir -ChildPath (GetIntermediateDirName)
$packageDirNames = Get-ChildItem -Path $packagesParentDir -Directory -Name

foreach ($packageDirName in $packageDirNames) {
    $packageDir = Join-Path -Path $packagesParentDir -ChildPath $packageDirName
    $packageJsonFilePath = Join-Path -Path $packageDir -ChildPath "package.json"
    $packageJsonFileContent = Get-Content -Path $packageJsonFilePath -Raw | ConvertFrom-Json

    $versionNumStrs = $packageJsonFileContent.version.Split(".")
    if ($versionNumStrs.length -ne 3) {
        throw "Package version must be separated by 3 dots."
    }

    $versionNums = foreach ($versionNumStr in $versionNumStrs) { [int]::parse($versionNumStr) }    
    $versionNums[(GetBumpIndex)]++;

    $packageJsonFileContent.version = [String]::Join(".", $versionNums)
    $packageJsonFileContent | ConvertTo-Json -Depth 5 | Set-Content $packageJsonFilePath
}
