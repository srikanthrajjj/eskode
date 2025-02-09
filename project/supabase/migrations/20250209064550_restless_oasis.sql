/*
  # Add Additional Police Officers

  1. New Officers
    - Adding 5 new officers with diverse roles and specialties:
      - Detective Inspector from Organized Crime
      - Police Sergeant from Special Operations
      - Detective Constable from Domestic Violence Unit
      - Police Constable from K-9 Unit
      - Detective Sergeant from Cold Case Unit

  2. Changes
    - Inserting new officers into the existing officers table
    - Maintaining existing table structure and policies
*/

-- Insert 5 new officers
INSERT INTO officers (officer_id, name, rank, division, image_url) VALUES
  ('DI 78234', 'Victoria Chang', 'Detective Inspector', 'Organized Crime', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PS 65432', 'Omar Al-Rashid', 'Police Sergeant', 'Special Operations', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DC 89123', 'Maya Williams', 'Detective Constable', 'Domestic Violence Unit', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('PC 34567', 'Daniel Torres', 'Police Constable', 'K-9 Unit', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'),
  ('DS 45678', 'Grace Sullivan', 'Detective Sergeant', 'Cold Case Unit', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');