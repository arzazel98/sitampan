-- Update Services berdasarkan Pricelist TAMPAN.YK
truncate table public.services;

insert into public.services (nama, harga, deskripsi) values 
('Hair Cut', 30000, 'Potong rambut basic'),
('Shaving', 15000, 'Cukur jenggot/kumis'),
('Hair Styling', 20000, 'Styling rambut'),
('Hair Mask', 25000, 'Perawatan masker rambut'),
('Face Mask', 20000, 'Perawatan masker wajah'),
('Vitamin', 4000, 'Pemberian vitamin rambut'),
('Semir Hitam', 35000, 'Pewarnaan hitam'),
('Coloring Basic', 100000, 'Coloring basic'),
('Coloring Fashion Short', 150000, 'Coloring fashion pendek'),
('Coloring Fashion Medium', 200000, 'Coloring fashion sedang'),
('Coloring Fashion Long', 250000, 'Coloring fashion panjang'),
('Bleaching Short', 150000, 'Bleaching pendek'),
('Bleaching Medium', 250000, 'Bleaching sedang'),
('Bleaching Long', 350000, 'Bleaching panjang'),
('Highlight Bleaching Short', 150000, 'Highlight bleaching pendek'),
('Highlight Bleaching Medium', 250000, 'Highlight bleaching sedang'),
('Highlight Bleaching Long', 350000, 'Highlight bleaching panjang'),
('Highlight Coloring Short', 250000, 'Highlight coloring pendek'),
('Highlight Coloring Medium', 350000, 'Highlight coloring sedang'),
('Highlight Coloring Long', 450000, 'Highlight coloring panjang');
