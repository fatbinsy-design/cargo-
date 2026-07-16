locals {
  common_tags = merge(
    {
      Project = var.project_name
      Managed = "terraform"
    },
    var.extra_tags
  )
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.private_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private"
    Tier = "private"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  depends_on = [aws_internet_gateway.this]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip"
  })
}

resource "aws_nat_gateway" "this" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt"
  })
}

resource "aws_route" "private_nat" {
  count                  = var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[0].id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "front" {
  name        = "${var.project_name}-front-sg"
  description = "Front layer: Internet entrypoint and SSH bastion"
  vpc_id      = aws_vpc.this.id

  ingress = []
  egress  = []

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-front-sg"
  })
}

resource "aws_security_group" "back" {
  name        = "${var.project_name}-back-sg"
  description = "Back layer: API reachable only from Front"
  vpc_id      = aws_vpc.this.id

  ingress = []
  egress  = []

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-back-sg"
  })
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg"
  description = "DB layer: PostgreSQL reachable only from Back"
  vpc_id      = aws_vpc.this.id

  ingress = []
  egress  = []

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "front_http" {
  security_group_id = aws_security_group.front.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  description       = "HTTP from Internet"
}

resource "aws_vpc_security_group_ingress_rule" "front_https" {
  security_group_id = aws_security_group.front.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "HTTPS from Internet"
}

resource "aws_vpc_security_group_ingress_rule" "front_ssh" {
  security_group_id = aws_security_group.front.id
  cidr_ipv4         = var.admin_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  description       = "SSH from administrator public IP"
}

resource "aws_vpc_security_group_ingress_rule" "back_app" {
  security_group_id            = aws_security_group.back.id
  referenced_security_group_id = aws_security_group.front.id
  ip_protocol                  = "tcp"
  from_port                    = var.backend_port
  to_port                      = var.backend_port
  description                  = "API traffic from Front"
}

resource "aws_vpc_security_group_ingress_rule" "back_ssh" {
  security_group_id            = aws_security_group.back.id
  referenced_security_group_id = aws_security_group.front.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  description                  = "SSH through Front bastion"
}

resource "aws_vpc_security_group_ingress_rule" "db_postgres" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.back.id
  ip_protocol                  = "tcp"
  from_port                    = var.db_port
  to_port                      = var.db_port
  description                  = "PostgreSQL from Back"
}

resource "aws_vpc_security_group_ingress_rule" "db_ssh" {
  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = aws_security_group.back.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  description                  = "SSH through Back from Front bastion"
}

resource "aws_vpc_security_group_egress_rule" "front_to_back_api" {
  security_group_id            = aws_security_group.front.id
  referenced_security_group_id = aws_security_group.back.id
  ip_protocol                  = "tcp"
  from_port                    = var.backend_port
  to_port                      = var.backend_port
  description                  = "Front reverse proxy to Back API"
}

resource "aws_vpc_security_group_egress_rule" "front_to_private_ssh" {
  security_group_id            = aws_security_group.front.id
  referenced_security_group_id = aws_security_group.back.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  description                  = "Front bastion SSH to Back"
}

resource "aws_vpc_security_group_egress_rule" "back_to_db_ssh" {
  security_group_id            = aws_security_group.back.id
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
  description                  = "Back SSH hop to DB"
}

resource "aws_vpc_security_group_egress_rule" "back_to_db" {
  security_group_id            = aws_security_group.back.id
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = var.db_port
  to_port                      = var.db_port
  description                  = "Back API to PostgreSQL"
}

resource "aws_vpc_security_group_egress_rule" "front_http_out" {
  security_group_id = aws_security_group.front.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  description       = "Package repositories and Certbot HTTP"
}

resource "aws_vpc_security_group_egress_rule" "front_https_out" {
  security_group_id = aws_security_group.front.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "Package repositories and registry HTTPS"
}

resource "aws_vpc_security_group_egress_rule" "private_http_out" {
  for_each = {
    back = aws_security_group.back.id
    db   = aws_security_group.db.id
  }

  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  description       = "Package repositories through NAT when enabled"
}

resource "aws_vpc_security_group_egress_rule" "private_https_out" {
  for_each = {
    back = aws_security_group.back.id
    db   = aws_security_group.db.id
  }

  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  description       = "Docker registry through NAT when enabled"
}

resource "aws_vpc_security_group_egress_rule" "dns_udp_out" {
  for_each = {
    front = aws_security_group.front.id
    back  = aws_security_group.back.id
    db    = aws_security_group.db.id
  }

  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "udp"
  from_port         = 53
  to_port           = 53
  description       = "DNS"
}

resource "aws_vpc_security_group_egress_rule" "dns_tcp_out" {
  for_each = {
    front = aws_security_group.front.id
    back  = aws_security_group.back.id
    db    = aws_security_group.db.id
  }

  security_group_id = each.value
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 53
  to_port           = 53
  description       = "DNS over TCP"
}

resource "aws_instance" "front" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.front.id]
  key_name                    = var.key_name
  associate_public_ip_address = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-front"
    Role = "front"
  })
}

resource "aws_eip" "front" {
  count    = var.create_front_elastic_ip ? 1 : 0
  domain   = "vpc"
  instance = aws_instance.front.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-front-eip"
  })
}

resource "aws_instance" "back" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.private.id
  vpc_security_group_ids      = [aws_security_group.back.id]
  key_name                    = var.key_name
  associate_public_ip_address = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-back"
    Role = "back"
  })
}

resource "aws_instance" "db" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.private.id
  vpc_security_group_ids      = [aws_security_group.db.id]
  key_name                    = var.key_name
  associate_public_ip_address = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db"
    Role = "db"
  })
}
