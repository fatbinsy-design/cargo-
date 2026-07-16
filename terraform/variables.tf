variable "project_name" {
  description = "Prefix used for AWS resource names."
  type        = string
  default     = "medishop-todo"
}

variable "aws_region" {
  description = "AWS region where the infrastructure is created."
  type        = string
  default     = "eu-west-3"
}

variable "availability_zone" {
  description = "Single availability zone used by the public and private subnets."
  type        = string
  default     = "eu-west-3a"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet."
  type        = string
  default     = "10.20.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for the private subnet."
  type        = string
  default     = "10.20.2.0/24"
}

variable "instance_type" {
  description = "EC2 type for the three instances."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of an existing AWS EC2 key pair."
  type        = string
}

variable "admin_cidr" {
  description = "Public CIDR allowed to SSH to the Front instance. Example: 203.0.113.10/32"
  type        = string
}

variable "backend_port" {
  description = "Port exposed by the backend API container."
  type        = number
  default     = 3000
}

variable "db_port" {
  description = "PostgreSQL port."
  type        = number
  default     = 5432
}

variable "create_front_elastic_ip" {
  description = "Attach an Elastic IP to the Front instance."
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Create a NAT Gateway so private instances can download packages and Docker images. Set to false only if another controlled egress path exists."
  type        = bool
  default     = true
}

variable "extra_tags" {
  description = "Additional tags to add to all tagged resources."
  type        = map(string)
  default     = {}
}
