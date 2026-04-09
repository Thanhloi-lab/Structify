export function addToggleCodeBlockButton(){
  document.querySelectorAll('.code-block.css-y5zsxb').forEach((codeBlock, _) => {
    const btn = document.createElement('span');
    btn.innerText = 'Show';
    btn.style.cursor = 'pointer';
    btn.style.color = 'blue';
    btn.style.display = 'inline-block';
    btn.style.marginBottom = '6px';

    let visible = false;
    codeBlock.style.display = visible ? 'block' :  'none'

    btn.onclick = () => {
      visible = !visible;
      codeBlock.style.display = visible ? 'block' : 'none';
      btn.innerText = visible ? 'Hide' : 'Show';
    };

    codeBlock.parentNode.insertBefore(btn, codeBlock);
  });
}