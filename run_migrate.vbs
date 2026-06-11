Dim WshShell, pgBin, pgData, pgLog, cmd

Set WshShell = CreateObject("WScript.Shell")

pgBin  = WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\scoop\apps\postgresql\18.4\pgsql\bin"
pgData = WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\pgdata"
pgLog  = pgData & "\pg.log"
pgDir  = WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\OneDrive\Documents\Claude\Projects\epicerie promo"

' Build a cmd command that: starts PG, waits, migrates — all in one visible window
cmd = "cmd.exe /k """ & _
      "SET PGBIN=" & pgBin & " && " & _
      "SET PGDATA=" & pgData & " && " & _
      "SET PGPASSWORD=EpiceriePromo2026#Secure! && " & _
      "SET SUPABASE_URL=postgresql://postgres@db.fkdyrhmtwkfpfyoaztdu.supabase.co:5432/postgres && " & _
      "echo === Demarrage PostgreSQL === && " & _
      Chr(34) & pgBin & "\pg_ctl" & Chr(34) & " start -D " & Chr(34) & pgData & Chr(34) & " -l " & Chr(34) & pgLog & Chr(34) & " && " & _
      "timeout /t 6 /nobreak && " & _
      "echo === Migration vers Supabase === && " & _
      "call " & Chr(34) & pgDir & "\migrate_to_supabase.bat" & Chr(34) & " && " & _
      "echo. && echo === MIGRATION TERMINEE - NE PAS FERMER CETTE FENETRE === && " & _
      "pause" & _
      """"

' WindowStyle 1 = normal visible window
WshShell.Run cmd, 1, False
