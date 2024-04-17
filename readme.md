# PostgreSQL Copy

## Descrição
Script CLI Node para transferir dados entre bancos de dados PostgreSQL de forma fácil.

## Como usar

### Passo 1: Adicionar arquivos (apenas para PG v10 ou anterior)

Copie os arquivos abaixo:
- `/services/pg_dump.exe`
- `/services/pg_restore.exe`

E cole na pasta "bin" do seu PostgreSQL.
Obs: no meu caso, fica localizada em "`C:\Program Files\PostgreSQL\10\bin`".

Isso é necessário para que o comando `--rows-per-insert=1000`, do `pg_dump`, funcione.

### Passo 2: Adicionar as variáveis de ambiente

Adicione à variável de ambiente do sistema "Path" o caminho da pasta "bin" do seu PostgreSQL.

### Passo 3: Instale o Node.js (se não tiver)

[Clique aqui](https://nodejs.org/en) para acessar a página do Node.js e fazer o download.

### Passo 4: Instalar bibliotecas

Acesse a pasta desse projeto e rode o comando abaixo:

```bash
npm install
```

### Passo 5: Configurar bancos de dados

Edite os objetos `dbSources` e `dbDestinations` do arquivo `config.js`.
De preferência, utilize o arquivo `.env` para preencher as credenciais de acesso.

### Passo 6: Faça as transferências

Agora que já está tudo configurado, você pode utilizar o bash para fazer transferências entre bancos de dados.

```bash
node pg-copy.js --db-source=producao --db-dest=producao --tables=rnc cargos defeitos_causas
```

O script acima vai fazer uma cópia das tabelas (`--tables`) do banco de dados de origem (`--db-source`) para o banco de dados de destino (`--db-dest`).

Você também pode passar parâmetros adicionais:
- `--clean`: Limpar o banco de dados de destino antes da cópia
- `--encode`: Definir a codificação dos dados
- `--ignore`: Informar que devem ser ignorados na exportação
- `--rows-per-insert`: Quantidade de linhas por insert
- `--only-restore`: Apenas restaurar, sem fazer o DUMP
- `--only-dump`: Apenas fazer o DUMP, sem restaurar
- `--rm`: Remover os arquivos de backup

### Considerações finais

Ainda que esse script facilite a transferência de dados entre bancos PostgreSQL, o processo pode ser melhorado.
Colabore com esse pequeno projeto, faça um pull request.