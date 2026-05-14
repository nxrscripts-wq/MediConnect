INSERT INTO health_units (id, code, name, type, province, municipality, address, phone, is_active)
VALUES
  (gen_random_uuid(), 'HJM', 'Hospital Josina Machel', 'Hospital Central', 'Luanda', 'Luanda', 'Rua da Missão, Luanda', '+244 923 000 001', true),
  (gen_random_uuid(), 'HAB', 'Hospital Américo Boavida', 'Hospital Central', 'Luanda', 'Luanda', 'Rua Cónego Manuel das Neves, Luanda', '+244 923 000 002', true),
  (gen_random_uuid(), 'MLP', 'Maternidade Lucrécia Paim', 'Hospital Especializado', 'Luanda', 'Luanda', 'Avenida Deolinda Rodrigues, Luanda', '+244 923 000 003', true),
  (gen_random_uuid(), 'HPDB', 'Hospital Pediátrico David Bernardino', 'Hospital Especializado', 'Luanda', 'Luanda', 'Rua Augusto Ngangula, Luanda', '+244 923 000 004', true),
  (gen_random_uuid(), 'HGL', 'Hospital Geral de Luanda', 'Hospital Geral', 'Luanda', 'Kilamba Kiaxi', 'Camama, Kilamba Kiaxi', '+244 923 000 005', true),
  (gen_random_uuid(), 'CMP', 'Clínica Multiperfil', 'Clínica Especializada', 'Luanda', 'Luanda', 'Morro do Bento, Luanda', '+244 923 000 006', true),
  (gen_random_uuid(), 'HGB', 'Hospital Geral de Benguela', 'Hospital Geral', 'Benguela', 'Benguela', 'Bairro da Graça, Benguela', '+244 923 000 007', true),
  (gen_random_uuid(), 'HGH', 'Hospital Geral do Huambo', 'Hospital Geral', 'Huambo', 'Huambo', 'Cidade Alta, Huambo', '+244 923 000 008', true),
  (gen_random_uuid(), 'HCL', 'Hospital Central do Lubango (Dr. António Agostinho Neto)', 'Hospital Central', 'Huíla', 'Lubango', 'Lubango', '+244 923 000 009', true),
  (gen_random_uuid(), 'HGM', 'Hospital Geral de Malanje', 'Hospital Geral', 'Malanje', 'Malanje', 'Malanje', '+244 923 000 010', true),
  (gen_random_uuid(), 'HGBIE', 'Hospital Geral do Bié (Walter Strangway)', 'Hospital Geral', 'Bié', 'Kuito', 'Kuito, Bié', '+244 923 000 011', true),
  (gen_random_uuid(), 'HPC', 'Hospital Provincial de Cabinda', 'Hospital Provincial', 'Cabinda', 'Cabinda', 'Cabinda', '+244 923 000 012', true),
  (gen_random_uuid(), 'CSS', 'Centro de Saúde da Samba', 'Centro de Saúde', 'Luanda', 'Samba', 'Samba, Luanda', '+244 923 000 013', true),
  (gen_random_uuid(), 'CSC', 'Centro de Saúde do Cazenga', 'Centro de Saúde', 'Luanda', 'Cazenga', 'Cazenga, Luanda', '+244 923 000 014', true),
  (gen_random_uuid(), 'HMK', 'Hospital Municipal do Kilamba Kiaxi', 'Hospital Municipal', 'Luanda', 'Kilamba Kiaxi', 'Kilamba Kiaxi, Luanda', '+244 923 000 015', true);
