# TP DevOps - MediShop Todo sur AWS

Ce depot contient les livrables attendus pour une architecture en trois couches :

- Front : instance EC2 publique, Nginx reverse proxy, conteneur frontend.
- Back : instance EC2 privee, conteneur API Node/Prisma.
- DB : instance EC2 privee, conteneur PostgreSQL.

## 1. Infrastructure Terraform

Copier l'exemple de variables, puis adapter la cle EC2 et votre IP publique :

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
terraform -chdir=terraform init
terraform -chdir=terraform plan
terraform -chdir=terraform apply
```

Sorties importantes :

```bash
terraform -chdir=terraform output front_public_ip
terraform -chdir=terraform output back_private_ip
terraform -chdir=terraform output db_private_ip
```

Le NAT Gateway est active dans `terraform/terraform.tfvars.example` afin que les instances privees puissent telecharger Docker, les paquets systeme et les images de conteneurs pendant le provisioning.

## 2. Provisioning Ansible

Apres le `terraform apply` :

```bash
ANSIBLE_USER=ubuntu \
POSTGRES_PASSWORD='<mot_de_passe_db>' \
DOMAIN_NAME='todo.example.com' \
ansible-playbook -i ansible/inventory/terraform.py ansible/site.yml --private-key ~/.ssh/votre-cle.pem
```

Le playbook installe Docker partout, configure PostgreSQL sur la DB, installe Nginx sur le Front et prepare le reverse proxy vers le Back.

Pour HTTPS :

```bash
ENABLE_HTTPS=true CERTBOT_EMAIL='admin@example.com' ansible-playbook -i ansible/inventory/terraform.py ansible/site.yml --private-key ~/.ssh/votre-cle.pem
```

## 3. Secrets GitHub Actions

Secrets requis :

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `EC2_SSH_KEY`
- `FRONT_HOST`
- `BACK_PRIVATE_IP`
- `DB_PRIVATE_IP`
- `POSTGRES_PASSWORD`

Secrets optionnels :

- `EC2_USER` par defaut `ubuntu`

Variables optionnelles :

- `DB_NAME` par defaut `todo_db`
- `DB_USER` par defaut `postgres`
- `APP_PORT` par defaut `3000`
- `FRONTEND_HOST_PORT` par defaut `8080`
- `SEED_DATABASE` par defaut `false`

## 4. CI/CD

Le workflow `.github/workflows/deploy.yml` se lance sur chaque push vers `main`.

Le workflow `.github/workflows/ci.yml` verifie aussi Terraform et Ansible :

- `terraform fmt -check`
- `terraform init -backend=false`
- `terraform validate`
- `ansible-playbook --syntax-check`

Le workflow `.github/workflows/deploy.yml` construit et pousse les images Docker Front/Back selon les fichiers modifies, puis deploie par SSH :

- Front directement via l'IP publique.
- Back via ProxyJump SSH en passant par l'instance Front.

Les scripts de deploiement gerent le premier deploiement et font un rollback vers l'image precedente si le healthcheck echoue.
