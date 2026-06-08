# Execute este arquivo como Administrador uma única vez
# Clique com botão direito → "Executar com PowerShell como Administrador"

$nodePath  = "C:\Program Files\nodejs\node.exe"
$scriptPath = "C:\Users\Suporte\bot-email\scheduler.js"
$workDir   = "C:\Users\Suporte\bot-email"

$action = New-ScheduledTaskAction `
  -Execute $nodePath `
  -Argument $scriptPath `
  -WorkingDirectory $workDir

# Inicia junto com o Windows
$trigger = New-ScheduledTaskTrigger -AtStartup

$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Hours 24) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName "BotEmailElevia" `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Bot de disparo de e-mail Elevia Growth" `
  -RunLevel Highest `
  -Force

Write-Host ""
Write-Host "✅ Tarefa registrada com sucesso!" -ForegroundColor Green
Write-Host "O bot vai iniciar automaticamente toda vez que o Windows ligar."
Write-Host ""
Write-Host "Para iniciar agora sem reiniciar, rode:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName 'BotEmailElevia'"
