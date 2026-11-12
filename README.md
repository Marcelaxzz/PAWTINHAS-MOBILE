# Pawtinhas-Mobile

App do Pawtinhas para Android e iOS em **React Native com Expo (SDK 57)**. Tem as mesmas telas e funcionalidades do site (Pawtinhas-Front) e usa a mesma API (Pawtinhas-Back).

- **Área pública:** boas-vindas, catálogo de adoção com destaques e filtros, página do animal, favoritos (guardados no aparelho), como adotar e sobre nós.
- **Acesso:** login com verificação em duas etapas por e-mail e troca de senha com código. Só `carolpawtinhas@gmail.com` entra; os códigos saem de `pawtinhas04@gmail.com`.
- **Painel:**
  - início com o resumo do dia;
  - agenda (consultas, vacinas, cirurgias, banho e tosa, pet sitter, emergências), com formulários, detalhes, troca de status e relatórios;
  - pacientes, ficha, tutores, tratamentos, planos alimentares e medições;
  - alarmes, calculadoras de dose e de ração, catálogos de medicamentos e rações;
  - prótese 3D: câmera, medição por foto com detecção do cartão, modelo e arquivo STL;
  - administração de adoções e configurações.
- **Só no app:** os alarmes tocam no próprio celular, mesmo com a tela bloqueada (veja [Alarmes](#alarmes)).

## Rodando no celular

Requisitos: Node 20+, a API rodando e o app **Expo Go** no celular, na mesma rede Wi-Fi do computador.

```powershell
npm install
npm start          # sincroniza com o site e abre o Expo; leia o QR code com o Expo Go
```

Sem `.env`, o app procura a API e o site **no mesmo computador que roda o `npm start`**:

| Serviço | Endereço usado | Como subir para o celular enxergar |
| --- | --- | --- |
| API | `http://<ip-do-pc>:5135/api` | `dotnet run --urls http://0.0.0.0:5135` (em `Pawtinhas-Back/src/Pawtinhas.API`) |
| Site (OpenCV.js da medição) | `http://<ip-do-pc>:5173` | `npm run dev -- --host` (em `Pawtinhas-Front`) |

O Firewall do Windows precisa liberar as portas 5135 e 5173 na rede privada. Para outro endereço, copie `.env.example` para `.env`:

```ini
EXPO_PUBLIC_API_URL=https://pawtinhas.exemplo.com.br/api
EXPO_PUBLIC_SITE_URL=https://pawtinhas.exemplo.com.br
EXPO_PUBLIC_WHATSAPP=5534999990000
```

No navegador (`npm run web`, porta 8081), a API precisa aceitar a origem: `Cors__Origens__0=http://localhost:8081`.

Com o site e a API publicados no Railway, use o domínio do site nos dois endereços (o site repassa `/api` para a API):

```ini
EXPO_PUBLIC_API_URL=https://<dominio-do-site>.up.railway.app/api
EXPO_PUBLIC_SITE_URL=https://<dominio-do-site>.up.railway.app
```

No iPhone, o Expo Go só abre o projeto com a mesma conta Expo logada no celular e no computador (`npx expo login`).

## Alarmes

Cada alarme ativo do painel vira um lembrete agendado no aparelho, que toca na hora certa **com o celular bloqueado e sem internet**. A agenda é refeita ao entrar no app, ao voltar para ele e sempre que um alarme é salvo, pausado ou excluído.

- **Android.** O lembrete usa um canal próprio no fluxo de áudio de **alarme**, então não fica mudo com o volume de notificações baixo. Ele tem importância máxima, aparece na tela de bloqueio e passa pelo Não perturbe quando o sistema permite.
  - O horário é exato: o app declara `USE_EXACT_ALARM` e `SCHEDULE_EXACT_ALARM`.
  - O lembrete sobrevive ao reinício do celular.
  - Em alguns aparelhos (Xiaomi, Samsung, Motorola), toque em **Bateria sem restrição** na tela de Alarmes para o fabricante não adiar o toque.
- **iOS.** O som do alarme tem 28 s, o máximo que o iOS aceita numa notificação, e o lembrete usa o nível "time sensitive". Limitações do iOS:
  - com a chave de silencioso ligada, o sistema não toca som de notificação;
  - o som que fura o silencioso ("critical alert") depende de autorização especial da Apple.
- **Ao tocar.** Na notificação, ou com o app aberto, abre a tela **Alarme tocando**: som em repetição, vibração e tela acesa até alguém tocar em **Parar alarme**. Ela para sozinha depois de 5 minutos.
- **Recorrências** (as mesmas da API):

  | Recorrência | Como o celular agenda |
  | --- | --- |
  | Diário | Um lembrete por dia |
  | A cada 8 horas | Três por dia |
  | A cada 12 horas | Dois por dia |
  | Dias úteis | Segunda a sexta |
  | Semanal | No dia da semana em que o celular recebeu o alarme |
  | Somente hoje | Uma vez, no dia em que o celular recebeu o alarme |

- **Teste.** O botão **Testar alarme**, na tela de Alarmes, toca um alarme 10 s depois. Dá para bloquear a tela e conferir.
- **Saída.** Ao sair da conta, os lembretes deste aparelho são cancelados, porque mostram nomes de pacientes.

O **Expo Go** serve para testar as telas. Para o comportamento completo do alarme (som próprio, canal de alarme e horário exato), instale o APK (veja a próxima seção).

## Gerando o APK

```powershell
npm install -g eas-cli
eas login
eas build -p android --profile preview      # APK para instalar direto no celular
```

O endereço da API entra no build pelo `.env` ou pelas variáveis do EAS (`EXPO_PUBLIC_API_URL`). O Android só libera HTTP sem TLS quando a API configurada é `http://` (API de teste na rede local, veja `app.config.js`). Em produção, use `https`.

## O app e o site andam juntos

Tudo o que não depende do navegador vem do próprio site, para os dois não divergirem:

- contratos da API e validações;
- regras da agenda e geometria da medição;
- gerador do STL e formulários da agenda;
- hooks de dados, ícones e imagens.

O `npm run sincronizar` (que roda sozinho antes do `npm start`) copia esses arquivos de `../Pawtinhas-Front/src` para `src/web/`.

- **Não edite `src/web/`**: mude no site e sincronize. Para o site em outra pasta, use `PAWTINHAS_FRONT=C:\caminho\Pawtinhas-Front`.
- Os módulos do site que dependem do navegador são trocados pelo Metro pelas versões de `src/plataforma/` (veja `metro.config.js`): `http.js` (cookies e CSRF), `arquivos.js` (envio de fotos), `images.js` e `react-router-dom`.

```
src/
├── app/            Rotas (expo-router), com os mesmos caminhos do site
├── componentes/    Botões, campos, janelas, cabeçalho, página e formulário configurável
├── telas/          Telas usadas por mais de uma rota (ficha, formulários, adoção...)
├── alarmes/        Agendamento dos alarmes no aparelho e tela "Alarme tocando"
├── protese/        Foto da medição, visão computacional (WebView) e ajudantes
├── adocao/         Card e favoritos
├── plataforma/     Versões nativas de http, cookies, fotos, imagens, impressão e arquivos
├── web/            Copiado do site (não editar)
├── tema.js         Cores, fontes e sombras do site
└── config.js       Endereços da API e do site
```

## Segurança

**Sessão**
- É a mesma do site: JWT de curta duração e renovação rotativa, nos cookies httpOnly definidos pela API.
- No celular, o app guarda esses cookies sozinho e os reenvia só para o caminho e o protocolo certos. Os de "Lembrar de mim" ficam no Keychain/Keystore (expo-secure-store, criptografado); os de sessão, só na memória.

**Requisições**
- Toda alteração leva o token CSRF (`X-XSRF-TOKEN`), que a API também devolve no cabeçalho para o app.

**Fotos**
- As fotos de pacientes e animais são reduzidas e regravadas em JPEG antes do envio, o que descarta a localização e os demais metadados.
- A foto da medição da prótese não sai do aparelho: a análise roda numa WebView local e só as medidas vão para a ficha.

**Configuração**
- Não há segredo no código. O `.env` só tem endereços públicos.
