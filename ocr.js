'use strict';
// Small images need enlargement before recognition. Keep the stored photo unchanged.
async function prepareOCRImage(source){
 const img=new Image();img.src=source;await img.decode();
 const scale=Math.min(4,Math.max(1,1600/Math.max(img.naturalWidth,img.naturalHeight)));
 const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,canvas.width,canvas.height);
 return canvas;
}
async function runOCR(){
 if(!photo||busy)return;
 if(fields.some(k=>$(k).value.trim())&&!confirm('読み取った項目で入力内容を置き換えます。空欄の読み取り結果は上書きしません。続けますか？'))return;
 const token=++photoVersion,source=photo;setBusy(true);$('ocrStatus').textContent='画像を調整しています…';
 let worker=null,timer=null,expired=false;
 const timed=promise=>Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('読み取りの制限時間を超えました。アプリを開き直して再試行してください。'))},90000)})]).finally(()=>clearTimeout(timer));
 try{
  const input=await prepareOCRImage(source);if(token!==photoVersion)return;
  if(typeof Tesseract==='undefined')throw Error('OCR本体を読み込めません。オンラインで再読み込みし、vendorフォルダが配置されているか確認してください。');
  const base=new URL('./vendor/',location.href).href;
  $('ocrStatus').textContent='日本語・英語の認識データを準備しています…';
  const pendingWorker=Tesseract.createWorker(['jpn','eng'],1,{workerPath:base+'worker.min.js',corePath:base,langPath:base.slice(0,-1),workerBlobURL:false,logger:m=>{if(token===photoVersion)$('ocrStatus').textContent=m.status==='recognizing text'?'文字を読み取り中… '+Math.round(m.progress*100)+'%':'認識データを準備中… '+Math.round((m.progress||0)*100)+'%'}});
  pendingWorker.then(w=>{if(expired||token!==photoVersion)w.terminate().catch(()=>{})},()=>{});
  worker=await timed(pendingWorker);if(token!==photoVersion)return;ocrWorker=worker;
  await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1'});
  const result=await timed(worker.recognize(input));if(token!==photoVersion)return;
  const text=result.data.text;$('ocrText').value=text;$('ocrDetails').hidden=false;$('ocrDetails').open=true;
  const parsed=MeishiCore.parseOCR(text);let filled=0;for(const k of fields)if(parsed[k]){$(k).value=parsed[k];filled++}
  dirty=true;$('ocrStatus').textContent=text.trim()?'読み取り完了（'+filled+'項目）。原文と写真を照合し、誤りを修正して保存してください。':'文字を検出できませんでした。明るく正面から、名刺が画面いっぱいになるよう撮り直してください。';
 }catch(e){if(token===photoVersion)$('ocrStatus').textContent='読み取りに失敗：'+(e.message||String(e))+'\n写真は保持しています。再読み取りか手入力をご利用ください。';console.error(e)}
 finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});if(ocrWorker===worker)ocrWorker=null;if(token===photoVersion)setBusy(false)}
}
