import { supabase } from '../lib/supabase'
const KEY = 'sitampan_commission_payouts'
function cacheGet(){ try{ const r=localStorage.getItem(KEY); return r?JSON.parse(r):[] }catch{ return [] } }
function cacheSet(v){ try{ localStorage.setItem(KEY, JSON.stringify(v.slice(0,200))) }catch{} }
export async function fetchPayouts(){
  try{
    const { data, error } = await supabase.from('commission_payouts').select('*').order('created_at',{ascending:false}).limit(200)
    if(error) throw error
    cacheSet(data||[])
    return data||[]
  }catch{ return cacheGet() }
}
export async function createPayout({ barberName, barberTitle, periode, jumlah, totalKomisiSaatPayout, sisa, metode, keterangan, dibayarOleh }){
  const payload={ barber_name: barberName, barber_title: barberTitle||'', periode: periode|| new Date().toISOString().slice(0,7), jumlah_payout: Number(jumlah)||0, total_komisi_saat_payout: Number(totalKomisiSaatPayout)||0, sisa_komisi: Number(sisa)||0, metode: metode||'Tunai', keterangan: keterangan||'', dibayar_oleh: dibayarOleh||'Owner' }
  try{
    const { data, error } = await supabase.from('commission_payouts').insert(payload).select().single()
    if(error) throw error
    const c=cacheGet(); c.unshift(data); cacheSet(c); return data
  }catch{
    const fallback={ id:`PAY-${Date.now()}`, ...payload, created_at: new Date().toISOString() }
    const c=cacheGet(); c.unshift(fallback); cacheSet(c); return fallback
  }
}
export async function deletePayout(id){
  try{ const { error }=await supabase.from('commission_payouts').delete().eq('id', id); if(error) throw error }catch{}
  const c=cacheGet().filter(x=>x.id!==id); cacheSet(c); return c
}
export function getPayoutsByBarber(all, name){ return (all||[]).filter(p=>p.barber_name===name) }
export function totalPaidForBarber(all, name){ return getPayoutsByBarber(all,name).reduce((s,p)=>s+Number(p.jumlah_payout||0),0) }
