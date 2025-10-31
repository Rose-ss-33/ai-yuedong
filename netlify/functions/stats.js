exports.handler = async () => {
  // 如果需要，未来可接入 Netlify KV/Blobs 或外部数据库返回全站统计
  return { statusCode: 200, body: JSON.stringify({ ok:true, msg:'stats placeholder' }) };
};
