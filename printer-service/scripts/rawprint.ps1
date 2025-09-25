param(
  [Parameter(Mandatory=$true)][string]$Printer,
  [string]$Path,
  [string]$Base64
)

Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32.SafeHandles;

public class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.Drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);

    [DllImport("winspool.Drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static void SendBytes(string printerName, byte[] bytes)
    {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
            throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());

        try
        {
            var di = new DOCINFOA(){ pDocName = "RAW", pDataType = "RAW" };
            if (!StartDocPrinter(hPrinter, 1, di))
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            if (!StartPagePrinter(hPrinter))
                throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());

            IntPtr unmanagedPointer = Marshal.AllocHGlobal(bytes.Length);
            try
            {
                Marshal.Copy(bytes, 0, unmanagedPointer, bytes.Length);
                int written;
                if (!WritePrinter(hPrinter, unmanagedPointer, bytes.Length, out written))
                    throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            }
            finally
            {
                Marshal.FreeHGlobal(unmanagedPointer);
            }

            EndPagePrinter(hPrinter);
            EndDocPrinter(hPrinter);
        }
        finally
        {
            ClosePrinter(hPrinter);
        }
    }
}
"@

if (-not $Path -and -not $Base64) {
  throw "Provide -Path or -Base64"
}

[byte[]]$bytes = $null
if ($Base64) {
  $bytes = [Convert]::FromBase64String($Base64)
} else {
  $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $Path))
}

[RawPrinterHelper]::SendBytes($Printer, $bytes)

