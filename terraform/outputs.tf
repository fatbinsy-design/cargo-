output "front_public_ip" {
  description = "Public IP of the Front instance. Point the domain to this IP."
  value       = try(aws_eip.front[0].public_ip, aws_instance.front.public_ip)
}

output "front_private_ip" {
  description = "Private IP of the Front instance."
  value       = aws_instance.front.private_ip
}

output "back_private_ip" {
  description = "Private IP of the Back instance."
  value       = aws_instance.back.private_ip
}

output "db_private_ip" {
  description = "Private IP of the DB instance."
  value       = aws_instance.db.private_ip
}

output "security_groups" {
  description = "Security Group IDs by layer."
  value = {
    front = aws_security_group.front.id
    back  = aws_security_group.back.id
    db    = aws_security_group.db.id
  }
}

output "ansible_inventory_command" {
  description = "Command to run Ansible with the Terraform dynamic inventory."
  value       = "ansible-playbook -i ansible/inventory/terraform.py ansible/site.yml --private-key <PATH_TO_PRIVATE_KEY>"
}
