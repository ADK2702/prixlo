' start_postgres.vbs
' Démarre PostgreSQL sans fenêtre console (processus vraiment détaché)
' Double-cliquer depuis l'Explorateur, ou placer un raccourci dans Démarrage

Dim pgCtl, pgData, pgLog, cmd
pgCtl = Environ("USERPROFILE") & "\scoop\apps\postgresql\18.4\pgsql\bin\pg_ctl.exe"
pgData = Environ("USERPROFILE") & "\pgdata"
pgLog  = pgData & "\pg.log"

cmd = """" & pgCtl & """ start -D """ & pgData & """ -l """ & pgLog & """"

Dim WshShell
Set WshShell = CreateObject("WScript.Shell")
' WindowStyle 0 = caché, False = ne pas attendre
WshShell.Run cmd, 0, False

WScript.Sleep 3000  ' laisser 3s pour démarrage

' Vérifier si le serveur tourne
Dim result
result = WshShell.Run("""" & pgCtl & """ status -D """ & pgData & """", 0, True)
If result = 0 Then
    WScript.Echo "PostgreSQL démarré avec succès."
Else
    WScript.Echo "Attention: pg_ctl status = " & result & " (peut prendre quelques secondes)"
End If
